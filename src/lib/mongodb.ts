import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";

const requiredEnv = ["MONGODB_URI", "MONGODB_DATABASE"] as const;

type MongoEnv = Record<(typeof requiredEnv)[number], string>;

export type TaskRecord = {
  id: string;
  title: string;
  description: string;
  status: "todo" | "doing" | "done";
  completed: boolean;
  priority: "High" | "Medium" | "Low";
  createdAt: string;
  updatedAt: string;
};

type DbTaskRecord = {
  _id: ObjectId;
  title: string;
  description: string;
  status: TaskRecord["status"];
  completed: boolean;
  priority: TaskRecord["priority"];
  createdAt: Date;
  updatedAt: Date;
};

function readMongoEnv(): MongoEnv {
  const env = {
    MONGODB_URI: process.env.MONGODB_URI ?? "",
    MONGODB_DATABASE: process.env.MONGODB_DATABASE ?? "",
  } satisfies MongoEnv;

  const missing = requiredEnv.filter((key) => !env[key]);
  if (missing.length) {
    throw new Error(`Missing MongoDB env var${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}`);
  }

  return env;
}

const mongoEnv = readMongoEnv();

let cachedClient: MongoClient | null = null;

async function getMongoClient() {
  if (cachedClient) return cachedClient;

  const client = new MongoClient(mongoEnv.MONGODB_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();
  cachedClient = client;
  return cachedClient;
}

function toObjectId(id: string) {
  try {
    return new ObjectId(id);
  } catch {
    throw new Error("Invalid task id.");
  }
}

function alignStatusAndCompletion(status: TaskRecord["status"] | undefined, completed: boolean | undefined) {
  if (completed || status === "done") {
    return { status: "done" as const, completed: true };
  }

  if (status === "doing") {
    return { status: "doing" as const, completed: false };
  }

  return { status: "todo" as const, completed: false };
}

function normalizeTask(doc: DbTaskRecord): TaskRecord {
  const { status, completed } = alignStatusAndCompletion(doc.status, doc.completed);
  const priority: TaskRecord["priority"] = ["High", "Low", "Medium"].includes(doc.priority)
    ? doc.priority
    : "Medium";

  return {
    id: doc._id.toHexString(),
    title: doc.title,
    description: doc.description ?? "",
    status,
    completed,
    priority,
    createdAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: doc.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

async function getTasksCollection() {
  const client = await getMongoClient();
  const db = client.db(mongoEnv.MONGODB_DATABASE);
  return db.collection<DbTaskRecord>("tasks");
}

export async function fetchTasks() {
  const collection = await getTasksCollection();
  const docs = await collection.find({}).sort({ updatedAt: -1 }).limit(100).toArray();
  return docs.map(normalizeTask);
}

export async function insertTask(input: {
  title: string;
  description?: string;
  status?: TaskRecord["status"];
  completed?: boolean;
  priority?: TaskRecord["priority"];
}) {
  const title = input.title?.trim();
  if (!title) throw new Error("A task title is required.");

  const description = input.description?.trim() ?? "";
  const { status, completed } = alignStatusAndCompletion(input.status, input.completed);
  const priority: TaskRecord["priority"] = ["High", "Low", "Medium"].includes(input.priority ?? "")
    ? (input.priority as TaskRecord["priority"])
    : "Medium";
  const now = new Date();

  const collection = await getTasksCollection();
  const result = await collection.insertOne({
    title,
    description,
    status,
    completed,
    priority,
    createdAt: now,
    updatedAt: now,
  });

  return normalizeTask({
    _id: result.insertedId,
    title,
    description,
    status,
    completed,
    priority,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateTask(
  id: string,
  updates: Partial<Pick<TaskRecord, "title" | "description" | "status" | "completed" | "priority">>,
) {
  const collection = await getTasksCollection();
  const _id = toObjectId(id);
  const existing = await collection.findOne({ _id });
  if (!existing) throw new Error("Task not found.");

  const title = typeof updates.title === "string" ? updates.title.trim() : existing.title;
  const description = typeof updates.description === "string" ? updates.description.trim() : existing.description ?? "";

  const priority: TaskRecord["priority"] =
    updates.priority && ["High", "Low", "Medium"].includes(updates.priority)
      ? updates.priority
      : existing.priority ?? "Medium";

  const { status, completed } = alignStatusAndCompletion(
    updates.status ?? existing.status,
    typeof updates.completed === "boolean" ? updates.completed : existing.completed,
  );

  await collection.updateOne(
    { _id },
    {
      $set: {
        title,
        description,
        status,
        completed,
        priority,
        updatedAt: new Date(),
      },
    },
  );
}

export async function deleteTask(id: string) {
  const collection = await getTasksCollection();
  const _id = toObjectId(id);
  const result = await collection.deleteOne({ _id });
  if (result.deletedCount === 0) {
    throw new Error("Task not found.");
  }
}
