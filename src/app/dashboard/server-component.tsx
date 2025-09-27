import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function ServerComponent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/signin");
  }

  return (
    <div className="bg-white rounded-lg shadow px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard (Server Component)</h1>
      </div>
      <div className="mt-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900">Welcome, {session.user.name}!</h2>
          <p className="mt-2 text-gray-600">Email: {session.user.email}</p>
          <p className="mt-2 text-gray-600">User ID: {session.user.id}</p>
        </div>
      </div>
    </div>
  );
}
