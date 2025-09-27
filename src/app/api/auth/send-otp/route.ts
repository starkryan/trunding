import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

const handler = auth.handler;

export const POST = toNextJsHandler(handler)["POST"];
