export const reviews = [
  {
    reviewId: "REV001",
    agentId: "AGENT001",
    agentName: "John Doe",
    location: "New York",
    customerId: "CUST001",
    customerName: "Jane Smith",
    rating: 4,
    comment: "Fast delivery but packaging was damaged.",
    orderId: "ORDER001",
    orderPrice: 50.99,
    discountApplied: 5.0,
    orderType: "Express",
    sentiment: "Positive",
    performance: "Fast",
    accuracy: "Order Accurate",
    complaints: ["Damaged Goods"],
    createdAt: "2023-10-01T12:34:56Z",
  },
  // Add more reviews here...
];

export const analytics = {
  averageRatingsPerLocation: {
    "New York": 4.2,
    "Los Angeles": 3.8,
    Chicago: 4.5,
  },
  topPerformingAgents: [
    { agentName: "John Doe", rating: 4.8 },
    { agentName: "Alice Johnson", rating: 4.7 },
  ],
  bottomPerformingAgents: [
    { agentName: "Bob Smith", rating: 2.5 },
    { agentName: "Charlie Brown", rating: 2.8 },
  ],
  mostCommonComplaints: [
    { complaint: "Late Delivery", count: 120 },
    { complaint: "Wrong Item", count: 80 },
    { complaint: "Damaged Goods", count: 60 },
  ],
  ordersByPriceRange: {
    "0-50": 200,
    "50-100": 150,
    "100+": 50,
  },
};
