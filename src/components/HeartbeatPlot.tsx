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
import { listen } from "@tauri-apps/api/event";

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
    const unlistenPromise = listen("heartbeat_datum", (event) => {
      const datum = event.payload as number;
      setData((prev) => [...prev.slice(-499), datum]); // Keep the last 50 data points
      setLabels((prev) => [...prev.slice(-499), prev.length + 1]); // Increment labels
    });

    return () => {
      unlistenPromise.then((fn) => fn());
    };
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
        tension: 0.1, // Smooth curve
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
    animations: false,
  };

  return (
    <div>
      <h2>Heartbeat Signal</h2>
      <div style={{ height: "300px" }}>
        <Line ref={chartRef} data={chartData} options={options as any} />
      </div>
    </div>
  );
};

export default HeartbeatPlot;
