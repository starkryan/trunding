import { prisma } from "./prisma";

export async function makeUserAdmin(userId: string, role: "ADMIN" | "SUPER_ADMIN" = "ADMIN") {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Error making user admin:", error);
    return { success: false, error: "Failed to update user role" };
  }
}

export async function removeUserAdmin(userId: string) {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: "USER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Error removing user admin:", error);
    return { success: false, error: "Failed to update user role" };
  }
}

export async function getAdminUsers() {
  try {
    const adminUsers = await prisma.user.findMany({
      where: {
        role: { in: ["ADMIN", "SUPER_ADMIN"] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, users: adminUsers };
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return { success: false, error: "Failed to fetch admin users" };
  }
}