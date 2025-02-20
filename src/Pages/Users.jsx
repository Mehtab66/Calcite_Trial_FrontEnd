import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Dummy Data for Users
const dummyUsers = [
  { id: 1, name: "Admin John", email: "john@admin.com", role: "Admin" },
  { id: 2, name: "User Alice", email: "alice@user.com", role: "User" },
  { id: 3, name: "User Bob", email: "bob@user.com", role: "User" },
  { id: 4, name: "User Clara", email: "clara@example.com", role: "User" },
  { id: 5, name: "Admin Dana", email: "dana@admin.com", role: "Admin" },
  { id: 6, name: "User Eve", email: "eve@test.com", role: "User" },
];

const User = () => {
  const [users, setUsers] = useState(dummyUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmAction, setConfirmAction] = useState(null); // {userId, action: "delete" | "makeAdmin"}

  // Handle Delete User
  const handleDeleteUser = (id) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    toast.success("User deleted successfully!");
    setConfirmAction(null);
  };

  // Handle Make Admin
  const handleMakeAdmin = (id) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id && u.role !== "Admin" ? { ...u, role: "Admin" } : u
      )
    );
    toast.success("User role updated to Admin!");
    setConfirmAction(null);
  };

  // Handle Search
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl text-center font-bold mb-8 text-gray-800">
        User Management
      </h1>

      {/* Search Bar */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
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

      {/* Users Table */}
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
                <tr key={u.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{u.name}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{u.role}</td>
                  <td className="p-3 flex gap-2">
                    {u.role !== "Admin" && (
                      <button
                        onClick={() =>
                          setConfirmAction({
                            userId: u.id,
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
                        setConfirmAction({ userId: u.id, action: "delete" })
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

      {/* Confirmation Modal */}
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
                    users.find((u) => u.id === confirmAction.userId).name
                  } an Admin`
                : `delete ${
                    users.find((u) => u.id === confirmAction.userId).name
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
