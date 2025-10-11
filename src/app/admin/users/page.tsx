"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  MoreHorizontal,
  UserCheck,
  UserX,
  Shield,
  Users,
  Filter,
  Download,
  RefreshCw,
  Plus,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Activity,
  CreditCard,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  UserPlus,
  UserMinus,
  Settings,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  Home,
  BarChart3,
  FileText,
  Database,
  HelpCircle,
  LogOut,
  Sun,
  Moon,
  Bell,
  Star,
  Heart,
  Briefcase,
  GraduationCap,
  Globe,
  Building2,
  Award,
  Target,
  Zap,
  Ban,
  Lock,
  Unlock,
  Wallet,
  PlusCircle,
  MinusCircle,
  DollarSign,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Receipt,
  History
} from "lucide-react";
import { format } from "date-fns";

interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  isAdmin: boolean;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  banned: boolean;
  banReason?: string;
  banExpires?: string;
  createdAt: string;
  updatedAt: string;
  wallet?: {
    id: string;
    balance: number;
    currency: string;
    createdAt: string;
    updatedAt: string;
  };
  stats: {
    totalDeposits: number;
    totalWithdrawals: number;
    pendingWithdrawals: number;
    availableBalance: number;
    netFlow: number;
  };
  _count: {
    sessions: number;
    accounts: number;
    transactions: number;
    withdrawalRequests: number;
  };
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUserForBan, setSelectedUserForBan] = useState<User | null>(null);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<User | null>(null);
  const [banReason, setBanReason] = useState("");

  // Balance adjustment states
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [selectedUserForBalance, setSelectedUserForBalance] = useState<User | null>(null);
  const [balanceAction, setBalanceAction] = useState<'add' | 'subtract' | 'set'>('add');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceReason, setBalanceReason] = useState('');
  const [isAdjustingBalance, setIsAdjustingBalance] = useState(false);

  const fetchUsers = async (page = 1, search = "", role = "all", status = "all") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search,
        role,
        status,
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data: UsersResponse = await response.json();
        setUsers(data.users);
        setCurrentPage(data.pagination.page);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, isAdmin: boolean, role: string, banned?: boolean) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, isAdmin, role, banned }),
      });

      if (response.ok) {
        await fetchUsers(currentPage, searchTerm, selectedRole, selectedStatus);
      }
    } catch (error) {
      console.error("Error updating user role:", error);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchUsers(currentPage, searchTerm, selectedRole, selectedStatus);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const banUser = async (userId: string, ban: boolean = true, reason?: string) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, banned: ban, banReason: reason }),
      });

      if (response.ok) {
        await fetchUsers(currentPage, searchTerm, selectedRole, selectedStatus);
      }
    } catch (error) {
      console.error("Error banning user:", error);
    }
  };

  const handleBanUser = (user: User) => {
    setSelectedUserForBan(user);
    setBanReason(user.banReason || "");
    setBanDialogOpen(true);
  };

  const confirmBan = async () => {
    if (selectedUserForBan) {
      await banUser(selectedUserForBan.id, !selectedUserForBan.banned, banReason);
      setBanDialogOpen(false);
      setSelectedUserForBan(null);
      setBanReason("");
    }
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUserForDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedUserForDelete) {
      await deleteUser(selectedUserForDelete.id);
      setDeleteDialogOpen(false);
      setSelectedUserForDelete(null);
    }
  };

  const adjustUserBalance = async (userId: string, action: 'add' | 'subtract' | 'set', amount: number, reason: string) => {
    try {
      setIsAdjustingBalance(true);
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: 'adjust_balance',
          userId,
          adjustmentType: action,
          amount,
          reason
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await fetchUsers(currentPage, searchTerm, selectedRole, selectedStatus);
        setBalanceDialogOpen(false);
        setSelectedUserForBalance(null);
        setBalanceAmount('');
        setBalanceReason('');
        setBalanceAction('add');
        // Show success message
        alert('Balance adjusted successfully!');
      } else {
        alert(`Error: ${data.error || 'Failed to adjust balance'}`);
      }
    } catch (error) {
      console.error("Error adjusting balance:", error);
      alert('Network error. Please try again.');
    } finally {
      setIsAdjustingBalance(false);
    }
  };

  const handleBalanceAdjustment = (user: User) => {
    setSelectedUserForBalance(user);
    setBalanceDialogOpen(true);
  };

  const confirmBalanceAdjustment = async () => {
    if (selectedUserForBalance && balanceAmount && balanceReason) {
      const amount = parseFloat(balanceAmount);
      if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
      }
      await adjustUserBalance(selectedUserForBalance.id, balanceAction, amount, balanceReason);
    }
  };

  const handleBulkAction = async (action: string) => {
    try {
      const response = await fetch("/api/admin/users/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userIds: Array.from(selectedUsers), action }),
      });

      if (response.ok) {
        setSelectedUsers(new Set());
        setShowBulkActions(false);
        await fetchUsers(currentPage, searchTerm, selectedRole, selectedStatus);
      }
    } catch (error) {
      console.error("Error performing bulk action:", error);
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const selectAllUsers = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
      setShowBulkActions(true);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage, searchTerm, selectedRole, selectedStatus);
  }, [currentPage, searchTerm, selectedRole, selectedStatus]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers(1, searchTerm, selectedRole, selectedStatus);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
    fetchUsers(1, searchTerm, selectedRole, selectedStatus);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-red-100 text-red-700 border-red-200";
      case "ADMIN":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const exportUsers = () => {
    const csvContent = [
      ["Name", "Email", "Role", "Status", "Joined", "Sessions"],
      ...users.map(user => [
        user.name,
        user.email,
        user.role,
        user.emailVerified ? "Verified" : "Pending",
        format(new Date(user.createdAt), "MMM d, yyyy"),
        user._count.sessions.toString()
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", "users.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin" className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>User Management</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportUsers}>
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">Export</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => fetchUsers(currentPage, searchTerm, selectedRole, selectedStatus)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Add User</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u._count.sessions > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{users.reduce((sum, u) => sum + (u.wallet?.balance || 0), 0).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{users.reduce((sum, u) => sum + u.stats.totalDeposits, 0).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground">
              All time deposits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₹{users.reduce((sum, u) => sum + u.stats.totalWithdrawals, 0).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground">
              All time withdrawals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ₹{users.reduce((sum, u) => sum + u.stats.pendingWithdrawals, 0).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground">
              Pending withdrawals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            View and manage all registered users on the platform with advanced filtering
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit" className="hidden sm:flex">
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
                <Button type="submit" size="sm" className="sm:hidden">
                  <Search className="h-4 w-4" />
                </Button>
              </form>
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={selectedRole} onValueChange={(value) => {
                setSelectedRole(value);
                handleFilterChange();
              }}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={(value) => {
                setSelectedStatus(value);
                handleFilterChange();
              }}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={() => {
                setSearchTerm("");
                setSelectedRole("all");
                setSelectedStatus("all");
                setCurrentPage(1);
                fetchUsers(1, "", "all", "all");
              }}>
                <Filter className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {showBulkActions && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4 p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">
                {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex flex-wrap gap-2 ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction("make_admin")}
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Make Admin</span>
                  <span className="sm:hidden">Admin</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction("remove_admin")}
                >
                  <UserX className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Remove Admin</span>
                  <span className="sm:hidden">Remove</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction("delete")}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedUsers(new Set());
                    setShowBulkActions(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={selectedUsers.size === users.length && users.length > 0}
                      onChange={selectAllUsers}
                    />
                  </TableHead>
                  <TableHead className="min-w-[150px]">User</TableHead>
                  <TableHead className="min-w-[200px] hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Role</TableHead>
                  <TableHead className="hidden md:table-cell">Balance</TableHead>
                  <TableHead className="hidden lg:table-cell">Net Flow</TableHead>
                  <TableHead className="hidden sm:table-cell">Joined</TableHead>
                  <TableHead className="hidden xl:table-cell">Transactions</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/50">
                    <TableCell>
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`/placeholder-avatar-${user.id}.jpg`} />
                          <AvatarFallback>
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground hidden md:block">ID: {user.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm truncate max-w-[200px]" title={user.email}>{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <Badge variant={user.emailVerified ? "default" : "secondary"}>
                          {user.emailVerified ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verified
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </>
                          )}
                        </Badge>
                        {user.banned && (
                          <Badge variant="destructive">
                            <Ban className="w-3 h-3 mr-1" />
                            Banned
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                        {user.role === "SUPER_ADMIN" && <Shield className="w-3 h-3 mr-1" />}
                        {user.role === "ADMIN" && <ShieldCheck className="w-3 h-3 mr-1" />}
                        {user.role === "USER" && <Users className="w-3 h-3 mr-1" />}
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <IndianRupee className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {(user.wallet?.balance || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        {user.stats.pendingWithdrawals > 0 && (
                          <div className="text-xs text-orange-600">
                            -{user.stats.pendingWithdrawals.toLocaleString('en-IN')} pending
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className={`flex items-center gap-1 text-sm ${user.stats.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {user.stats.netFlow >= 0 ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                        <span>₹{Math.abs(user.stats.netFlow).toLocaleString('en-IN')}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(user.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <div className="text-sm">
                        <div>{user._count.transactions} transactions</div>
                        <div className="text-xs text-muted-foreground">
                          {user._count.withdrawalRequests} withdrawals
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => updateUserRole(user.id, !user.isAdmin, user.role)}>
                            {user.isAdmin ? (
                              <>
                                <UserX className="mr-2 h-4 w-4" />
                                Remove Admin
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Make Admin
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateUserRole(user.id, user.isAdmin, "ADMIN")}>
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Set as Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateUserRole(user.id, user.isAdmin, "USER")}>
                            <Users className="mr-2 h-4 w-4" />
                            Set as User
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleBalanceAdjustment(user)} className="text-blue-600">
                            <Wallet className="mr-2 h-4 w-4" />
                            Adjust Balance
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleBanUser(user)} className={user.banned ? "text-green-600" : "text-red-600"}>
                            {user.banned ? (
                              <>
                                <Unlock className="mr-2 h-4 w-4" />
                                Unban User
                              </>
                            ) : (
                              <>
                                <Lock className="mr-2 h-4 w-4" />
                                Ban User
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteUser(user)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <div className="text-sm text-muted-foreground text-center sm:text-left">
                Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, users.length)} of {users.length} users
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ban/Unban Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUserForBan?.banned ? "Unban User" : "Ban User"}
            </DialogTitle>
            <DialogDescription>
              {selectedUserForBan?.banned
                ? "Are you sure you want to unban this user? They will regain access to their account."
                : "Are you sure you want to ban this user? They will lose access to their account."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!selectedUserForBan?.banned && (
              <div className="space-y-2">
                <Label htmlFor="banReason">Reason for ban (optional)</Label>
                <textarea
                  id="banReason"
                  className="w-full p-2 border rounded-md"
                  rows={3}
                  placeholder="Enter the reason for banning this user..."
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant={selectedUserForBan?.banned ? "default" : "destructive"}
                onClick={confirmBan}
              >
                {selectedUserForBan?.banned ? "Unban User" : "Ban User"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone and will permanently remove all user data including their account, sessions, and associated records.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="font-medium">User to be deleted:</div>
              <div className="text-sm text-muted-foreground">
                {selectedUserForDelete?.name} ({selectedUserForDelete?.email})
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                ID: {selectedUserForDelete?.id?.slice(0, 8)}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Balance Adjustment Dialog */}
      <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Adjust User Balance
            </DialogTitle>
            <DialogDescription>
              Adjust the wallet balance for {selectedUserForBalance?.name} ({selectedUserForBalance?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Current Balance Display */}
            {selectedUserForBalance && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Current Balance:</span>
                    <div className="font-semibold text-lg">
                      ₹{(selectedUserForBalance.wallet?.balance || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Available Balance:</span>
                    <div className="font-semibold text-lg text-green-600">
                      ₹{selectedUserForBalance.stats.availableBalance.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Deposits:</span>
                    <div className="font-semibold text-green-600">
                      +₹{selectedUserForBalance.stats.totalDeposits.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Withdrawals:</span>
                    <div className="font-semibold text-red-600">
                      -₹{selectedUserForBalance.stats.totalWithdrawals.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Balance Adjustment Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Adjustment Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={balanceAction === 'add' ? 'default' : 'outline'}
                    onClick={() => setBalanceAction('add')}
                    className="flex items-center gap-2"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant={balanceAction === 'subtract' ? 'default' : 'outline'}
                    onClick={() => setBalanceAction('subtract')}
                    className="flex items-center gap-2"
                  >
                    <MinusCircle className="h-4 w-4" />
                    Subtract
                  </Button>
                  <Button
                    type="button"
                    variant={balanceAction === 'set' ? 'default' : 'outline'}
                    onClick={() => setBalanceAction('set')}
                    className="flex items-center gap-2"
                  >
                    <DollarSign className="h-4 w-4" />
                    Set
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="balanceAmount">
                  Amount {balanceAction === 'set' ? '(new balance)' : `(to ${balanceAction})`}
                </Label>
                <Input
                  id="balanceAmount"
                  type="number"
                  placeholder="Enter amount..."
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="balanceReason">Reason for Adjustment</Label>
                <textarea
                  id="balanceReason"
                  className="w-full p-2 border rounded-md min-h-[80px] resize-none"
                  placeholder="Enter the reason for this balance adjustment..."
                  value={balanceReason}
                  onChange={(e) => setBalanceReason(e.target.value)}
                  maxLength={500}
                />
                <div className="text-xs text-muted-foreground text-right">
                  {balanceReason.length}/500 characters
                </div>
              </div>

              {/* Preview */}
              {balanceAmount && !isNaN(parseFloat(balanceAmount)) && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <strong>Preview:</strong> {balanceAction === 'add' ? 'Add' : balanceAction === 'subtract' ? 'Subtract' : 'Set'} balance{' '}
                    {balanceAction === 'set' ? 'to' : 'by'} ₹{parseFloat(balanceAmount).toLocaleString('en-IN')}
                    {balanceAction !== 'set' && (
                      <>
                        <br />
                        New balance will be: ₹{balanceAction === 'add'
                          ? ((selectedUserForBalance?.wallet?.balance || 0) + parseFloat(balanceAmount)).toLocaleString('en-IN')
                          : balanceAction === 'subtract'
                          ? Math.max(0, (selectedUserForBalance?.wallet?.balance || 0) - parseFloat(balanceAmount)).toLocaleString('en-IN')
                          : parseFloat(balanceAmount).toLocaleString('en-IN')
                        }
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => {
                setBalanceDialogOpen(false);
                setSelectedUserForBalance(null);
                setBalanceAmount('');
                setBalanceReason('');
                setBalanceAction('add');
              }}>
                Cancel
              </Button>
              <Button
                onClick={confirmBalanceAdjustment}
                disabled={!balanceAmount || !balanceReason || isAdjustingBalance || parseFloat(balanceAmount) <= 0}
              >
                {isAdjustingBalance ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    {balanceAction === 'add' ? 'Add Balance' : balanceAction === 'subtract' ? 'Subtract Balance' : 'Set Balance'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}