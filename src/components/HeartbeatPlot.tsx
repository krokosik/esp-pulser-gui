import React, { useEffect, useState, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  LinearScale,
  PointElement,
  CategoryScale,
  Tooltip,
  Title,
} from "chart.js";

// Register chart components
ChartJS.register(
  LineElement,
  LinearScale,
  PointElement,
  CategoryScale,
  Tooltip,
  Title
);

const HeartbeatPlot: React.FC = () => {
  const [data, setData] = useState<number[]>([]);
  const [labels, setLabels] = useState<number[]>([]);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    // Simulated heartbeat data every 500ms
    const interval = setInterval(() => {
      const randomBpm = Math.floor(Math.random() * 30) + 60; // Simulate BPM between 60-90
      setData((prev) => [...prev.slice(-49), randomBpm]); // Keep the last 50 data points
      setLabels((prev) => [...prev.slice(-49), prev.length + 1]); // Increment labels
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Heartbeat BPM",
        data,
        fill: false,
        borderColor: "#137CBD",
        backgroundColor: "rgba(19, 124, 189, 0.2)",
        tension: 0.3, // Smooth curve
      },
    ],
  };

  const options = {
    scales: {
      y: {
        beginAtZero: false,
        suggestedMin: 50,
        suggestedMax: 100,
      },
    },
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        intersect: false,
      },
    },
  };

  return (
    <div>
      <h2>Heartbeat Signal</h2>
      <div style={{ height: "300px" }}>
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
    </div>
  );
};

export default HeartbeatPlot;
