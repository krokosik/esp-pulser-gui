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
import { CompoundTag, Icon } from "@blueprintjs/core";

// Register chart components
ChartJS.register(
  LineElement,
  LinearScale,
  PointElement,
  CategoryScale,
  Tooltip,
  Title
);

const dt = 1000 / 500; // 500 Hz sampling rate
const labels = Array.from(
  { length: 500 },
  (_, i) => -Math.round(i * dt)
).reverse();

const HeartbeatPlot: React.FC = () => {
  const [data, setData] = useState<number[]>([]);
  const [bpm, setBpm] = useState<number | null>(null);
  const [ibi, setIbi] = useState<number | null>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    const unlistenHeartbeatPromise = listen("heartbeat_datum", (event) => {
      const datum = event.payload as number;
      setData((prev) => [...prev.slice(-499), datum]);
    });
    const unlistenBpmPromise = listen("bpm_datum", (event) => {
      const bpm = event.payload as number;
      setBpm(bpm);
    });
    const unlistenIbiPromise = listen("ibi_datum", (event) => {
      const ibi = event.payload as number;
      setIbi(ibi);
    });

    return () => {
      unlistenHeartbeatPromise.then((fn) => fn());
      unlistenBpmPromise.then((fn) => fn());
      unlistenIbiPromise.then((fn) => fn());
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
        beginAtZero: true,
        suggestedMax: 4500,
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>
          <Icon icon="graph" /> Heartbeat Signal
        </h2>
        <div>
          <CompoundTag
            leftContent="BPM"
            large
            intent="danger"
            style={{ marginRight: "1rem" }}
          >
            {bpm}
          </CompoundTag>
          <CompoundTag leftContent="IBI" large intent="warning">
            {bpm !== null && bpm > 0 ? ibi : 0} ms
          </CompoundTag>
        </div>
      </div>
      <div style={{ height: "350px" }}>
        <Line ref={chartRef} data={chartData} options={options as any} />
      </div>
    </div>
  );
};

export default HeartbeatPlot;
