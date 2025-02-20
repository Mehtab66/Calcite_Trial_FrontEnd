import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
};

// Dummy Data
const dummyReviews = Array.from({ length: 50 }, (_, i) => ({
  _id: `review${i + 1}`,
  agentName: `Agent ${i + 1}`,
  location: ["New York", "Los Angeles", "Chicago", "Houston"][
    Math.floor(Math.random() * 4)
  ],
  rating: Math.floor(Math.random() * 5) + 1,
  performance: ["Fast", "Average", "Slow"][Math.floor(Math.random() * 3)],
  accuracy: ["Order Accurate", "Order Mistake"][Math.floor(Math.random() * 2)],
  sentiment: ["Positive", "Neutral", "Negative"][Math.floor(Math.random() * 3)],
  complaints:
    Math.random() > 0.5
      ? ["Late Delivery", "Rude Behavior"].slice(0, Math.random() > 0.5 ? 1 : 2)
      : [], // Always an array
  orderPrice: Math.floor(Math.random() * 150),
  orderType: ["Standard", "Express", "Same-Day"][Math.floor(Math.random() * 3)],
}));

const dummyUsers = [
  { id: 1, name: "Admin John", email: "john@admin.com", role: "Admin" },
  { id: 2, name: "User Alice", email: "alice@user.com", role: "User" },
  { id: 3, name: "User Bob", email: "bob@user.com", role: "User" },
];

const AdminDashboard = () => {
  const [reviews, setReviews] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [users, setUsers] = useState(dummyUsers);
  const [analytics, setAnalytics] = useState({});
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalReviews: 0,
    limit: 10,
  });
  const [tempFilters, setTempFilters] = useState({
    location: "",
    orderType: "",
    rating: "",
    performance: "",
    accuracy: "",
    sentiment: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    location: "",
    orderType: "",
    rating: "",
    performance: "",
    accuracy: "",
    sentiment: "",
  });
  const debouncedFilters = useDebounce(tempFilters, 500);
  const [error, setError] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null); // For tag editing
  const navigate = useNavigate();
  const { token, loading, user } = {
    token: "dummy-token",
    loading: false,
    user: { name: "Admin John", email: "john@admin.com", role: "Admin" },
  }; // Simulated auth

  const fetchDummyData = useCallback(() => {
    const paginatedReviews = dummyReviews.slice(0, pagination.limit);
    setReviews(paginatedReviews);
    setAllReviews(dummyReviews);
    setPagination({
      currentPage: 1,
      totalPages: Math.ceil(dummyReviews.length / pagination.limit),
      totalReviews: dummyReviews.length,
      limit: pagination.limit,
    });

    const analyticsData = {
      averageRating: (
        dummyReviews.reduce((sum, r) => sum + r.rating, 0) / dummyReviews.length
      ).toFixed(2),
      topAgent: dummyReviews.sort((a, b) => b.rating - a.rating)[0].agentName,
      bottomAgent: dummyReviews.sort((a, b) => a.rating - b.rating)[0]
        .agentName,
      mostCommonComplaint: "Late Delivery",
      ordersByPriceRange: { "0-50": 15, "50-100": 20, "100+": 15 },
      complaintsData: {
        labels: ["Late Delivery", "Rude Behavior"],
        counts: [10, 5],
      },
    };
    setAnalytics(analyticsData);
  }, [pagination.limit]);

  useEffect(() => {
    if (!loading) {
      fetchDummyData();
    }
  }, [fetchDummyData, loading]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setTempFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => setAppliedFilters(debouncedFilters);
  const clearFilters = () => {
    const cleared = {
      location: "",
      orderType: "",
      rating: "",
      performance: "",
      accuracy: "",
      sentiment: "",
    };
    setTempFilters(cleared);
    setAppliedFilters(cleared);
  };

  const filteredReviews = useMemo(() => {
    const source =
      appliedFilters.location ||
      appliedFilters.orderType ||
      appliedFilters.rating ||
      appliedFilters.performance ||
      appliedFilters.accuracy ||
      appliedFilters.sentiment
        ? allReviews
        : reviews;
    return source.filter(
      (review) =>
        (!appliedFilters.location ||
          review.location
            .toLowerCase()
            .includes(appliedFilters.location.toLowerCase())) &&
        (!appliedFilters.orderType ||
          review.orderType === appliedFilters.orderType) &&
        (!appliedFilters.rating ||
          review.rating === parseInt(appliedFilters.rating)) &&
        (!appliedFilters.performance ||
          review.performance === appliedFilters.performance) &&
        (!appliedFilters.accuracy ||
          review.accuracy === appliedFilters.accuracy) &&
        (!appliedFilters.sentiment ||
          review.sentiment === appliedFilters.sentiment)
    );
  }, [reviews, allReviews, appliedFilters]);

  const filteredPagination = useMemo(() => {
    const isFiltered =
      appliedFilters.location ||
      appliedFilters.orderType ||
      appliedFilters.rating ||
      appliedFilters.performance ||
      appliedFilters.accuracy ||
      appliedFilters.sentiment;
    if (isFiltered) {
      const totalFilteredReviews = filteredReviews.length;
      const totalFilteredPages = Math.ceil(
        totalFilteredReviews / pagination.limit
      );
      return {
        currentPage: Math.min(pagination.currentPage, totalFilteredPages || 1),
        totalPages: totalFilteredPages,
        totalReviews: totalFilteredReviews,
        limit: pagination.limit,
      };
    }
    return pagination;
  }, [filteredReviews, appliedFilters, pagination]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= filteredPagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: newPage }));
    }
  };

  const filteredMetrics = useMemo(() => {
    const source = allReviews;
    const filtered = source.filter(
      (review) =>
        (!appliedFilters.location ||
          review.location
            .toLowerCase()
            .includes(appliedFilters.location.toLowerCase())) &&
        (!appliedFilters.orderType ||
          review.orderType === appliedFilters.orderType) &&
        (!appliedFilters.rating ||
          review.rating === parseInt(appliedFilters.rating)) &&
        (!appliedFilters.performance ||
          review.performance === appliedFilters.performance) &&
        (!appliedFilters.accuracy ||
          review.accuracy === appliedFilters.accuracy) &&
        (!appliedFilters.sentiment ||
          review.sentiment === appliedFilters.sentiment)
    );

    if (!filtered.length)
      return {
        averageRating: "N/A",
        topAgent: "N/A",
        bottomAgent: "N/A",
        mostCommonComplaint: "N/A",
        ordersByPriceRange: { "0-50": 0, "50-100": 0, "100+": 0 },
        complaintsData: { labels: [], counts: [] },
      };

    const averageRating = (
      filtered.reduce((sum, r) => sum + r.rating, 0) / filtered.length
    ).toFixed(2);
    const agents = Object.values(
      filtered.reduce((acc, r) => {
        acc[r.agentName] = acc[r.agentName] || {
          total: 0,
          count: 0,
          agentName: r.agentName,
        };
        acc[r.agentName].total += r.rating;
        acc[r.agentName].count += 1;
        return acc;
      }, {})
    ).map((a) => ({
      agentName: a.agentName,
      averageRating: (a.total / a.count).toFixed(2),
    }));
    const sortedAgents = agents.sort(
      (a, b) => b.averageRating - a.averageRating
    );
    const topAgent = sortedAgents[0]?.agentName || "N/A";
    const bottomAgent =
      sortedAgents[sortedAgents.length - 1]?.agentName || "N/A";
    const complaints = filtered.flatMap((r) => r.complaints || []);
    const complaintCounts = complaints.reduce((acc, c) => {
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {});
    const sortedComplaints = Object.entries(complaintCounts).sort(
      (a, b) => b[1] - a[1]
    );
    const mostCommonComplaint = sortedComplaints[0]?.[0] || "None";
    const complaintsData = {
      labels: sortedComplaints.slice(0, 5).map(([c]) => c),
      counts: sortedComplaints.slice(0, 5).map(([, c]) => c),
    };
    const ordersByPriceRange = filtered.reduce(
      (acc, r) => {
        if (r.orderPrice <= 50) acc["0-50"] += 1;
        else if (r.orderPrice <= 100) acc["50-100"] += 1;
        else acc["100+"] += 1;
        return acc;
      },
      { "0-50": 0, "50-100": 0, "100+": 0 }
    );

    return {
      averageRating,
      topAgent,
      bottomAgent,
      mostCommonComplaint,
      ordersByPriceRange,
      complaintsData,
    };
  }, [allReviews, appliedFilters]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top" },
        tooltip: { backgroundColor: "rgba(0,0,0,0.8)" },
      },
    }),
    []
  );

  // Admin-specific functions
  const handleTagEdit = (review) => setSelectedReview({ ...review });
  const handleTagSave = () => {
    setAllReviews((prev) =>
      prev.map((r) => (r._id === selectedReview._id ? selectedReview : r))
    );
    setReviews((prev) =>
      prev.map((r) => (r._id === selectedReview._id ? selectedReview : r))
    );
    setSelectedReview(null);
    toast.success("Review tags updated successfully!");
  };
  const handleDeleteUser = (userId) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    toast.success("User deleted successfully!");
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl text-center font-bold mb-8 text-gray-800">
        Admin Dashboard
      </h1>
      <div className="flex flex-row justify-between items-center bg-white p-6 rounded-lg shadow-md mb-8">
        <p>
          <span className="font-bold">User:</span> {user?.name}
        </p>
        <p>
          <span className="font-bold">Email:</span> {user?.email}
        </p>
        <p>
          <span className="font-bold">Role:</span> {user?.role}
        </p>
      </div>
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      {/* Filters Section */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Filters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 mb-1">Location</label>
            <input
              type="text"
              name="location"
              value={tempFilters.location}
              onChange={handleFilterChange}
              placeholder="Enter city name"
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Order Type</label>
            <select
              name="orderType"
              value={tempFilters.orderType}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Order Types</option>
              {["Standard", "Express", "Same-Day"].map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Rating</label>
            <select
              name="rating"
              value={tempFilters.rating}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Ratings</option>
              {[1, 2, 3, 4, 5].map((num) => (
                <option key={num} value={num}>
                  {num} Star{num !== 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Performance</label>
            <select
              name="performance"
              value={tempFilters.performance}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Performance</option>
              {["Fast", "Average", "Slow"].map((perf) => (
                <option key={perf} value={perf}>
                  {perf}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Accuracy</label>
            <select
              name="accuracy"
              value={tempFilters.accuracy}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Accuracy</option>
              {["Order Accurate", "Order Mistake"].map((acc) => (
                <option key={acc} value={acc}>
                  {acc}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Sentiment</label>
            <select
              name="sentiment"
              value={tempFilters.sentiment}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Sentiments</option>
              {["Positive", "Neutral", "Negative"].map((sent) => (
                <option key={sent} value={sent}>
                  {sent}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={applyFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Apply Filters
          </button>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* User Management Section */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          User Management
        </h2>
        <table className="w-full table-auto">
          <thead className="bg-gray-100">
            <tr>
              {["Name", "Email", "Role", "Actions"].map((header) => (
                <th
                  key={header}
                  className="text-left p-3 text-gray-700 font-semibold"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">
                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {[
          { title: "Average Rating", value: filteredMetrics.averageRating },
          { title: "Total Reviews", value: filteredPagination.totalReviews },
          { title: "Top Agent", value: filteredMetrics.topAgent },
          { title: "Bottom Agent", value: filteredMetrics.bottomAgent },
          {
            title: "Most Common Complaint",
            value: filteredMetrics.mostCommonComplaint,
          },
        ].map((metric, idx) => (
          <div
            key={idx}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <h2 className="text-lg font-semibold text-gray-700">
              {metric.title}
            </h2>
            <p className="text-2xl text-gray-900 mt-2">{metric.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            Orders by Price Range
          </h2>
          <div style={{ height: "350px" }}>
            <Bar
              data={{
                labels: Object.keys(filteredMetrics.ordersByPriceRange),
                datasets: [
                  {
                    label: "Orders",
                    data: Object.values(filteredMetrics.ordersByPriceRange),
                    backgroundColor: ["#3b82f6", "#ef4444", "#10b981"],
                  },
                ],
              }}
              options={chartOptions}
            />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            Most Common Complaints
          </h2>
          <div style={{ height: "350px" }}>
            <Pie
              data={{
                labels: filteredMetrics.complaintsData.labels,
                datasets: [
                  {
                    data: filteredMetrics.complaintsData.counts,
                    backgroundColor: [
                      "#3b82f6",
                      "#ef4444",
                      "#10b981",
                      "#f59e0b",
                      "#8b5cf6",
                    ],
                  },
                ],
              }}
              options={chartOptions}
            />
          </div>
        </div>
      </div>

      {/* Reviews Table with Tag Editing */}
      <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          Filtered Reviews (Editable Tags)
        </h2>
        <table className="w-full table-auto">
          <thead className="bg-gray-100">
            <tr>
              {[
                "Agent",
                "Location",
                "Rating",
                "Performance",
                "Accuracy",
                "Sentiment",
                "Complaints",
                "Actions",
              ].map((header) => (
                <th
                  key={header}
                  className="text-left p-3 text-gray-700 font-semibold"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredReviews
              .slice(
                (filteredPagination.currentPage - 1) * filteredPagination.limit,
                filteredPagination.currentPage * filteredPagination.limit
              )
              .map((review) => (
                <tr key={review._id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{review.agentName}</td>
                  <td className="p-3">{review.location}</td>
                  <td className="p-3">{review.rating}</td>
                  <td className="p-3">{review.performance}</td>
                  <td className="p-3">{review.accuracy}</td>
                  <td className="p-3">{review.sentiment}</td>
                  <td className="p-3">
                    {Array.isArray(review.complaints)
                      ? review.complaints.join(", ")
                      : "None"}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => handleTagEdit(review)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Edit Tags
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => handlePageChange(filteredPagination.currentPage - 1)}
            disabled={filteredPagination.currentPage === 1}
            className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-300 hover:bg-blue-700"
          >
            Previous
          </button>
          <span className="text-gray-700">
            Page {filteredPagination.currentPage} of{" "}
            {filteredPagination.totalPages} (Total:{" "}
            {filteredPagination.totalReviews})
          </span>
          <button
            onClick={() => handlePageChange(filteredPagination.currentPage + 1)}
            disabled={
              filteredPagination.currentPage === filteredPagination.totalPages
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-300 hover:bg-blue-700"
          >
            Next
          </button>
        </div>
      </div>

      {/* Tag Editing Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit Review Tags</h2>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Performance</label>
              <select
                value={selectedReview.performance}
                onChange={(e) =>
                  setSelectedReview((prev) => ({
                    ...prev,
                    performance: e.target.value,
                  }))
                }
                className="w-full p-2 border rounded-md"
              >
                {["Fast", "Average", "Slow"].map((perf) => (
                  <option key={perf} value={perf}>
                    {perf}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Accuracy</label>
              <select
                value={selectedReview.accuracy}
                onChange={(e) =>
                  setSelectedReview((prev) => ({
                    ...prev,
                    accuracy: e.target.value,
                  }))
                }
                className="w-full p-2 border rounded-md"
              >
                {["Order Accurate", "Order Mistake"].map((acc) => (
                  <option key={acc} value={acc}>
                    {acc}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Sentiment</label>
              <select
                value={selectedReview.sentiment}
                onChange={(e) =>
                  setSelectedReview((prev) => ({
                    ...prev,
                    sentiment: e.target.value,
                  }))
                }
                className="w-full p-2 border rounded-md"
              >
                {["Positive", "Neutral", "Negative"].map((sent) => (
                  <option key={sent} value={sent}>
                    {sent}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleTagSave}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Save
              </button>
              <button
                onClick={() => setSelectedReview(null)}
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

export default AdminDashboard;
