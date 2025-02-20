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
import { BASE_URL } from "../../../Api.config";
import { useAuth } from "../../Context/AuthContext";

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

const Dashboard = () => {
  const [reviews, setReviews] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
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
    discountApplied: "",
    rating: "",
    performance: "",
    accuracy: "",
    sentiment: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    location: "",
    orderType: "",
    discountApplied: "",
    rating: "",
    performance: "",
    accuracy: "",
    sentiment: "",
  });
  const debouncedFilters = useDebounce(tempFilters, 500);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { token, loading, user } = useAuth();

  const fetchData = useCallback(
    async (page = 1) => {
      if (!token) {
        toast.error("No authentication token found. Please log in.");
        navigate("/login");
        return;
      }

      try {
        const [reviewsResponse, analyticsResponse] = await Promise.all([
          fetch(`${BASE_URL}review?page=${page}&limit=${pagination.limit}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${BASE_URL}review/analytics`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (
          reviewsResponse.status === 401 ||
          analyticsResponse.status === 401
        ) {
          toast.error("Session expired. Please log in again.");
          localStorage.removeItem("token");
          localStorage.removeItem("userRole");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }

        if (!reviewsResponse.ok || !analyticsResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const [reviewsData, analyticsData] = await Promise.all([
          reviewsResponse.json(),
          analyticsResponse.json(),
        ]);

        setReviews(reviewsData.reviews);
        setPagination({
          currentPage: reviewsData.pagination.currentPage,
          totalPages: reviewsData.pagination.totalPages,
          totalReviews: reviewsData.pagination.totalReviews,
          limit: reviewsData.pagination.limit,
        });

        if (page === 1 && !allReviews.length) {
          const allReviewsResponse = await fetch(
            `${BASE_URL}review?page=1&limit=${reviewsData.pagination.totalReviews}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const allReviewsData = await allReviewsResponse.json();
          setAllReviews(allReviewsData.reviews);
        }

        setAnalytics(analyticsData);
        setError(null);
      } catch (error) {
        console.error("Error fetching data:", error.message);
        setError(error.message);
        toast.error(`Failed to load dashboard data: ${error.message}`);
      }
    },
    [navigate, token, pagination.limit, allReviews.length]
  );

  useEffect(() => {
    if (!loading) {
      fetchData(pagination.currentPage);
    }
  }, [fetchData, pagination.currentPage, loading]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setTempFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => setAppliedFilters(debouncedFilters);
  const clearFilters = () => {
    const cleared = {
      location: "",
      orderType: "",
      discountApplied: "",
      rating: "",
      performance: "",
      accuracy: "",
      sentiment: "",
    };
    setTempFilters(cleared);
    setAppliedFilters(cleared);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const filteredReviews = useMemo(() => {
    const source = allReviews.length ? allReviews : reviews;

    return source.filter((review) => {
      const filterDiscount = appliedFilters.discountApplied
        ? Number(appliedFilters.discountApplied)
        : null;
      const reviewDiscount =
        review.discountApplied !== undefined
          ? Math.floor(review.discountApplied) // Compare only integer part
          : null;

      return (
        (!appliedFilters.location ||
          (review.location &&
            review.location
              .toLowerCase()
              .includes(appliedFilters.location.toLowerCase()))) &&
        (!appliedFilters.orderType ||
          (review.orderType &&
            review.orderType === appliedFilters.orderType)) &&
        (!filterDiscount ||
          (reviewDiscount !== null && reviewDiscount === filterDiscount)) &&
        (!appliedFilters.rating ||
          (review.rating &&
            review.rating === parseInt(appliedFilters.rating))) &&
        (!appliedFilters.performance ||
          (review.performance &&
            review.performance === appliedFilters.performance)) &&
        (!appliedFilters.accuracy ||
          (review.accuracy && review.accuracy === appliedFilters.accuracy)) &&
        (!appliedFilters.sentiment ||
          (review.sentiment && review.sentiment === appliedFilters.sentiment))
      );
    });
  }, [reviews, allReviews, appliedFilters]);

  const filteredPagination = useMemo(() => {
    const totalFilteredReviews = filteredReviews.length;
    const totalFilteredPages = Math.ceil(
      totalFilteredReviews / pagination.limit
    );
    const currentPageFiltered = Math.min(
      pagination.currentPage,
      totalFilteredPages || 1
    );
    return {
      currentPage: currentPageFiltered,
      totalPages: totalFilteredPages,
      totalReviews: totalFilteredReviews,
      limit: pagination.limit,
    };
  }, [filteredReviews, pagination.limit]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= filteredPagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: newPage }));
    }
  };

  const filteredMetrics = useMemo(() => {
    const source = filteredReviews;

    if (!source.length) {
      return null;
    }

    const totalRating = source.reduce((sum, r) => sum + (r.rating || 0), 0);
    const averageRating = Number((totalRating / source.length).toFixed(2));

    const agents = Object.values(
      source.reduce((acc, r) => {
        const agentKey = r.agentName || "Unknown";
        acc[agentKey] = acc[agentKey] || {
          total: 0,
          count: 0,
          agentName: r.agentName || "Unknown",
        };
        acc[agentKey].total += r.rating || 0;
        acc[agentKey].count += 1;
        return acc;
      }, {})
    ).map((a) => ({
      agentName: a.agentName,
      averageRating: Number((a.total / a.count).toFixed(2)),
    }));

    const sortedAgents = agents.sort(
      (a, b) => b.averageRating - a.averageRating
    );
    const topAgent = sortedAgents[0]?.agentName || "N/A";
    const bottomAgent =
      sortedAgents[sortedAgents.length - 1]?.agentName || "N/A";

    const complaints = source.flatMap((r) => r.complaints || []);
    const complaintCounts = complaints.reduce((acc, c) => {
      if (c) acc[c] = (acc[c] || 0) + 1;
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

    const ordersByPriceRange = source.reduce(
      (acc, r) => {
        if (typeof r.orderPrice === "number") {
          if (r.orderPrice <= 50) acc["0-50"] += 1;
          else if (r.orderPrice <= 100) acc["50-100"] += 1;
          else acc["100+"] += 1;
        }
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
  }, [filteredReviews]);

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

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl text-center font-bold mb-8 text-gray-800">
        User Dashboard
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
            <label className="block text-gray-700 mb-1">Discount Applied</label>
            <input
              type="number"
              name="discountApplied"
              value={tempFilters.discountApplied}
              onChange={handleFilterChange}
              placeholder="Enter discount amount"
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              step="any"
            />
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

      {filteredReviews.length === 0 && (
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700">
            No Data Found with Current Filters
          </h2>
          <p className="text-gray-600 mt-2">
            Please adjust or clear filters to view data.
          </p>
        </div>
      )}

      {filteredReviews.length > 0 && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {[
              { title: "Average Rating", value: filteredMetrics.averageRating },
              {
                title: "Total Reviews",
                value: filteredPagination.totalReviews,
              },
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
          {/* Reviews Table */}
          <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">
              Filtered Reviews (Paginated)
            </h2>
            <table className="w-full table-auto">
              <thead className="bg-gray-100">
                <tr>
                  {[
                    "Agent",
                    "Location",
                    "Order Type",
                    "Discount Applied",
                    "Rating",
                    "Performance",
                    "Accuracy",
                    "Sentiment",
                    "Complaints",
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
                    (filteredPagination.currentPage - 1) *
                      filteredPagination.limit,
                    filteredPagination.currentPage * filteredPagination.limit
                  )
                  .map((review) => (
                    <tr
                      key={review._id || review.reviewId}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="p-3">{review.agentName || "N/A"}</td>
                      <td className="p-3">{review.location || "N/A"}</td>
                      <td className="p-3">{review.orderType || "N/A"}</td>
                      <td className="p-3">
                        {review.discountApplied !== undefined
                          ? review.discountApplied.toFixed(2)
                          : "N/A"}
                      </td>
                      <td className="p-3">{review.rating || "N/A"}</td>
                      <td className="p-3">{review.performance || "N/A"}</td>
                      <td className="p-3">{review.accuracy || "N/A"}</td>
                      <td className="p-3">{review.sentiment || "N/A"}</td>
                      <td className="p-3">
                        {review.complaints?.join(", ") || "None"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() =>
                  handlePageChange(filteredPagination.currentPage - 1)
                }
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
                onClick={() =>
                  handlePageChange(filteredPagination.currentPage + 1)
                }
                disabled={
                  filteredPagination.currentPage ===
                  filteredPagination.totalPages
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-300 hover:bg-blue-700"
              >
                Next
              </button>
            </div>
          </div>
        </>
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

export default Dashboard;
