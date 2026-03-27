'use client';

import { useEffect, useRef, useState } from "react";
import Chart, { scales } from 'chart.js/auto';

export default function PieChart({ categories = [], dataSeries = [] }) {
  const divRef = useRef(null);
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    (async () => {
      if (chartRef.current && chartRef.current.destroy) {
        chartRef.current.destroy();
        chartRef.current = null;
      }

      let options = {
        type: 'pie',
        data: {
          labels: categories,
          datasets: dataSeries,
        },
      };

      chartRef.current = new Chart(canvasRef.current, options);
    }) ();
  }, [ dataSeries, categories ]);

  return (
    <div ref={divRef}>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}