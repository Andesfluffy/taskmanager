const requiredEnv = [
  "MONGODB_DATA_API_URL",
  "MONGODB_DATA_API_KEY",
  "MONGODB_DATA_SOURCE",
  "MONGODB_DATABASE",
] as const;

type MongoEnv = Record<(typeof requiredEnv)[number], string>;

type MongoDataApiResponse<T> = { document?: unknown; documents?: unknown[] } & T;

type MongoId = { $oid: string } | string | undefined;

export type TaskRecord = {
  _id?: MongoId;
  title: string;
  description?: string;
  status: "todo" | "doing" | "done";
  priority: "High" | "Medium" | "Low";
  createdAt: string;
  updatedAt: string;
};

function readMongoEnv(): MongoEnv {
  const env = {
    MONGODB_DATA_API_URL: process.env.MONGODB_DATA_API_URL ?? "",
    MONGODB_DATA_API_KEY: process.env.MONGODB_DATA_API_KEY ?? "",
    MONGODB_DATA_SOURCE: process.env.MONGODB_DATA_SOURCE ?? "",
    MONGODB_DATABASE: process.env.MONGODB_DATABASE ?? "",
  } satisfies MongoEnv;

  const missing = requiredEnv.filter((key) => !env[key]);
  if (missing.length) {
    throw new Error(
      `Missing MongoDB env var${missing.length > 1 ? "s" : ""}: ${missing
        .map((key) => key.replace("MONGODB_DATA_API_URL", "MongoDB Data API URL"))
        .join(", ")}`,
    );
  }

  return env;
}

async function callMongoDataApi<T>(action: string, payload: Record<string, unknown>) {
  const env = readMongoEnv();
  const response = await fetch(`${env.MONGODB_DATA_API_URL}/action/${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": env.MONGODB_DATA_API_KEY,
    },
    body: JSON.stringify({
      dataSource: env.MONGODB_DATA_SOURCE,
      database: env.MONGODB_DATABASE,
      ...payload,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`MongoDB request failed (${response.status}): ${errorBody || response.statusText}`);
  }

  return (await response.json()) as MongoDataApiResponse<T>;
}

function normalizeId(id: MongoId) {
  if (!id) return undefined;
  if (typeof id === "string") return id;
  if (typeof id === "object" && "$oid" in id) return id.$oid;
  return undefined;
}

export async function fetchTasks() {
  const result = await callMongoDataApi<{ documents: TaskRecord[] }>("find", {
    collection: "tasks",
    sort: { updatedAt: -1 },
    limit: 100,
  });

  return (result.documents ?? []).map((doc) => ({
    id: normalizeId(doc._id),
    title: doc.title,
    description: doc.description ?? "",
    status: doc.status ?? "todo",
    priority: doc.priority ?? "Medium",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }));
}

export async function insertTask(input: {
  title: string;
  description?: string;
  status?: TaskRecord["status"];
  priority?: TaskRecord["priority"];
}) {
  const now = new Date().toISOString();
  const task: TaskRecord = {
    title: input.title.trim(),
    description: input.description?.trim() ?? "",
    status: input.status ?? "todo",
    priority: input.priority ?? "Medium",
    createdAt: now,
    updatedAt: now,
  };

  const result = await callMongoDataApi<{ insertedId?: MongoId }>("insertOne", {
    collection: "tasks",
    document: task,
  });

  return { id: normalizeId(result.insertedId) ?? "", ...task };
}

export async function updateTask(
  id: string,
  updates: Partial<Pick<TaskRecord, "title" | "description" | "status" | "priority">>,
) {
  const sanitizedUpdates = {
    ...(typeof updates.title === "string" ? { title: updates.title.trim() } : {}),
    ...(typeof updates.description === "string" ? { description: updates.description.trim() } : {}),
    ...(typeof updates.status === "string" ? { status: updates.status } : {}),
    ...(typeof updates.priority === "string" ? { priority: updates.priority } : {}),
  };

  if (!Object.keys(sanitizedUpdates).length) {
    throw new Error("No valid fields provided to update the task.");
  }

  await callMongoDataApi("updateOne", {
    collection: "tasks",
    filter: { _id: { $oid: id } },
    update: { $set: { ...sanitizedUpdates, updatedAt: new Date().toISOString() } },
  });
}

export async function deleteTask(id: string) {
  await callMongoDataApi("deleteOne", {
    collection: "tasks",
    filter: { _id: { $oid: id } },
  });
}
