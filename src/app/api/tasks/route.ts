import { NextResponse } from "next/server";

import { deleteTask, fetchTasks, insertTask, updateTask } from "@/lib/mongodb";

type TaskRequestBody = {
  title?: string;
  description?: string;
  status?: "todo" | "doing" | "done";
  priority?: "High" | "Medium" | "Low";
  completed?: boolean;
};

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET() {
  try {
    const tasks = await fetchTasks();
    return NextResponse.json({ tasks });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load tasks.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: TaskRequestBody;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON payload.");
  }

  if (!body.title || typeof body.title !== "string") {
    return badRequest("A task title is required.");
  }

  try {
    const task = await insertTask({
      title: body.title,
      description: body.description,
      status: body.status,
      priority: body.priority,
      completed: body.completed,
    });
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create the task.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  let body: TaskRequestBody & { id?: string };
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON payload.");
  }

  if (!body.id || typeof body.id !== "string") {
    return badRequest("A valid task id is required to update.");
  }

  try {
    await updateTask(body.id, body);
    return NextResponse.json({ updated: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update the task.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON payload.");
  }

  if (!body.id || typeof body.id !== "string") {
    return badRequest("A valid task id is required to delete.");
  }

  try {
    await deleteTask(body.id);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete the task.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
