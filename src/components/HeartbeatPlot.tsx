import ChartStreaming from '@robloche/chartjs-plugin-streaming';
import {
  CategoryScale,
  Chart as ChartJS,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import 'chartjs-adapter-luxon';
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Line } from "react-chartjs-2";

import { CompoundTag, Icon } from "@blueprintjs/core";
import { listen } from "@tauri-apps/api/event";

// Register chart components
ChartJS.register(
  LineElement,
  LinearScale,
  PointElement,
  CategoryScale,
  Tooltip,
  Title,
  ChartStreaming
);

const SAMPLING_RATE = 25; // 25 Hz sampling rate
const SAMPLE_COUNT = 200;

const HeartbeatPlot: React.FC = () => {
  const [bpm, setBpm] = useState<number | null>(null);
  const [ibi, setIbi] = useState<number | null>(null);
  const chartRef = useRef<any>(null);
  const rawChartRef = useRef<any>(null);

  useEffect(() => {
    const unlistenRawHeartbeatPromise = listen("raw_heartbeat_datum", (event) => {
      const datum = event.payload as number;
      rawChartRef.current?.data.datasets[0].data.push({
        x: Date.now(),
        y: datum,
      });
    });
    const unlistenHeartbeatPromise = listen("heartbeat_datum", (event) => {
      const datum = event.payload as number;
      chartRef.current?.data.datasets[0].data.push({
        x: Date.now(),
        y: datum,
      });
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
      unlistenRawHeartbeatPromise.then((fn) => fn());
      unlistenHeartbeatPromise.then((fn) => fn());
      unlistenBpmPromise.then((fn) => fn());
      unlistenIbiPromise.then((fn) => fn());
    };
  }, []);

  const chartData = useMemo(() => ({
    datasets: [
      {
        label: "Raw Heartbeat",
        data: [],
        fill: false,
        borderColor: "#137CBD",
        backgroundColor: "rgba(19, 124, 189, 0.2)",
        tension: 0.1, // Smooth curve
      },
    ],
  }), []);

  const rawChartData = useMemo(() => ({
    datasets: [
      {
        label: "Processed Heartbeat",
        data: [],
        fill: false,
        color: "brown",
        borderColor: "#137CBD",
        backgroundColor: "rgba(19, 124, 189, 0.2)",
        tension: 0.1, // Smooth curve
      },
    ],
  }), []);

  const options = useMemo(() => ({
    scales: {
      y: {
        beginAtZero: false,
      },
      x: {
        type: 'realtime',
        realtime: {
          delay: 0,
          refresh: 1000 / SAMPLING_RATE,
          ttl: undefined,
          frameRate: SAMPLING_RATE,
          duration: 1000 * SAMPLE_COUNT / SAMPLING_RATE,
        }
      }
    },
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        intersect: false,
      },
    },
    animations: false,
  }), []);

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
      <div style={{ height: "260px" }}>
        <Line ref={chartRef} data={chartData} options={options as any} />
      </div>
      <h2>
          <Icon icon="graph" /> Raw Signal
        </h2>
      <div style={{ height: "260px" }}>
        <Line ref={rawChartRef} data={rawChartData} options={options as any} />
      </div>
    </div>
  );
};

export default HeartbeatPlot;
