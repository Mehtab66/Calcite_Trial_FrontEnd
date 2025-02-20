import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../Context/AuthContext";
import { BASE_URL } from "../../Api.config";

const User = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmAction, setConfirmAction] = useState(null); // {userId, action: "delete" | "makeAdmin"}
  const { token, loading, logout, user } = useAuth();
  const navigate = useNavigate();

  // Authentication and Authorization Check
  useEffect(() => {
    if (!loading) {
      console.log(
        "UserManagement: Checking auth - Token:",
        token,
        "User:",
        user
      ); // Debug
      if (!token || !user) {
        toast.error("Authentication required. Please log in.");
        navigate("/login");
      } else if (user.role !== "admin") {
        toast.error("Unauthorized access. Admins only.");
        navigate("/dashboard");
      }
    }
  }, [loading, token, user, navigate]);

  // Fetch users from the backend
  useEffect(() => {
    const fetchUsers = async () => {
      if (!token || user?.role !== "admin") return;

      try {
        console.log("Fetching users with token:", token); // Debug
        const response = await fetch(`${BASE_URL}users`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
          },
          credentials: "include",
        });

        console.log("Users Response Status:", response.status); // Debug
        if (response.status === 401) {
          toast.error("Session expired. Please log in again.");
          logout();
          navigate("/login");
          return;
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch users: ${errorText}`);
        }

        const data = await response.json();
        console.log("Users Data:", data); // Debug
        setUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching users:", error.message);
        toast.error(`Failed to load users: ${error.message}`);
        setUsers([]);
      }
    };

    if (!loading && token && user?.role === "admin") fetchUsers();
  }, [token, loading, navigate, logout, user]);

  // Handle Delete User
  const handleDeleteUser = async (id) => {
    if (!token || user?.role !== "admin") {
      toast.error("Authentication required.");
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}users/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
        credentials: "include",
      });

      if (response.status === 401) {
        toast.error("Session expired. Please log in again.");
        logout();
        navigate("/login");
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete user: ${errorText}`);
      }

      setUsers((prev) => prev.filter((u) => u._id !== id));
      toast.success("User deleted successfully!");
      setConfirmAction(null);
    } catch (error) {
      toast.error(`Failed to delete user: ${error.message}`);
    }
  };

  // Handle Make Admin
  const handleMakeAdmin = async (id) => {
    if (!token || user?.role !== "admin") {
      toast.error("Authentication required.");
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}users/${id}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({ role: "admin" }),
        credentials: "include",
      });

      if (response.status === 401) {
        toast.error("Session expired. Please log in again.");
        logout();
        navigate("/login");
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update user role: ${errorText}`);
      }

      const updatedUser = await response.json();
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? updatedUser.user : u))
      );
      toast.success("User role updated to Admin!");
      setConfirmAction(null);
    } catch (error) {
      toast.error(`Failed to update user role: ${error.message}`);
    }
  };

  // Handle Search
  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        (user.name &&
          user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.email &&
          user.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [users, searchQuery]);

  if (loading)
    return <div className="p-6 text-center text-gray-700">Loading...</div>;

  if (!token || user?.role !== "admin") return null;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl text-center font-bold mb-8 text-gray-800">
        User Management
      </h1>
      <div className="flex justify-between items-center mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md w-1/2">
          <label className="block text-gray-700 mb-2 font-semibold">
            Search Users
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/adminDashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
        <table className="w-full table-auto">
          <thead className="bg-gray-100">
            <tr>
              {["Name", "Email", "Role", "Actions"].map((h) => (
                <th
                  key={h}
                  className="text-left p-3 text-gray-700 font-semibold"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-3 text-center text-gray-600">
                  No users found matching your search.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u._id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{u.name ?? "N/A"}</td>
                  <td className="p-3">{u.email ?? "N/A"}</td>
                  <td className="p-3">{u.role ?? "N/A"}</td>
                  <td className="p-3 flex gap-2">
                    {u.role !== "admin" && (
                      <button
                        onClick={() =>
                          setConfirmAction({
                            userId: u._id,
                            action: "makeAdmin",
                          })
                        }
                        className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Make Admin
                      </button>
                    )}
                    <button
                      onClick={() =>
                        setConfirmAction({ userId: u._id, action: "delete" })
                      }
                      className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {confirmAction && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Confirm Action
            </h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to{" "}
              {confirmAction.action === "makeAdmin"
                ? `make ${
                    users.find((u) => u._id === confirmAction.userId)?.name ??
                    "this user"
                  } an Admin`
                : `delete ${
                    users.find((u) => u._id === confirmAction.userId)?.name ??
                    "this user"
                  }`}
              ?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() =>
                  confirmAction.action === "makeAdmin"
                    ? handleMakeAdmin(confirmAction.userId)
                    : handleDeleteUser(confirmAction.userId)
                }
                className={`px-4 py-2 ${
                  confirmAction.action === "makeAdmin"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                } text-white rounded-md`}
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default User;
