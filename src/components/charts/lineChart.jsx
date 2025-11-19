'use client';

import { useEffect, useRef, useState} from "react";
import Chart, { scales } from 'chart.js/auto';
import { random } from "@/helper/utils";
import { CHART_COLORS, getColorOfDataPoint, OUTLIER_DATA_POINT_COLOR } from "@/helper/chart";

export default function LineChart({ categories = [], dataSeries = [], ucl = null, lcl = null }) {
  const divRef = useRef(null);
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  
  const [chartData, setChartData] = useState(null);

  const isValueExeedsLimits = (value) => {
    return ucl && lcl && (value > ucl || value < lcl);
  };

  const shouldHighlightGridLine = (ctx) => {
    return ucl && lcl && (ctx.tick.value == ucl || ctx.tick.value == lcl);
  };

  const shouldHighlightDataPoint = (ctx) => {
    return isValueExeedsLimits(ctx.parsed.y);
  };

  const isEventHighLightsExeededDataPoints = (elements, chart) => {
    if (elements.length > 0) {
      const el = elements[0];

      const value = chart.data.datasets[el.datasetIndex].data[el.index];

      if (isValueExeedsLimits(value)) {
        return chart.data.datasets[el.datasetIndex];
      }
    }

    return false;
  };

  useEffect(() => {
    (async () => {
      if (chartRef.current && chartRef.current.destroy) {
        chartRef.current.destroy();
        chartRef.current = null;
      }

      let options = {
        type: 'line',
        data: {
          labels: categories,
          datasets: dataSeries.map(d => {
            return {
              ...d,
              borderColor: getColorOfDataPoint(0),
              tension: 0.4,
              pointBackgroundColor: (ctx) => (shouldHighlightDataPoint(ctx) ? OUTLIER_DATA_POINT_COLOR : getColorOfDataPoint(0)),
              pointBorderColor: (ctx) => (shouldHighlightDataPoint(ctx) ? OUTLIER_DATA_POINT_COLOR : getColorOfDataPoint(0)),
              pointRadius: (ctx) => (shouldHighlightDataPoint(ctx) ? 6 : 3),
              pointHoverRadius: (ctx) => (shouldHighlightDataPoint(ctx) ? 8 : 4),
            };
          }),
        },
        options: {
          scales: {
            y: {
              grid: {
                color: (ctx) =>  (shouldHighlightGridLine(ctx) ? OUTLIER_DATA_POINT_COLOR : 'rgba(0, 0, 0, 0.1)'),
                lineWidth: (ctx) =>  (shouldHighlightGridLine(ctx) ? 3 : 1),
              },
              min: 0,
            },
          },
          onHover: (event, elements, chart) => {
            const canvas = chart.canvas;

            if (isEventHighLightsExeededDataPoints(elements, chart)) {
              canvas.style.cursor = 'pointer';
            } else {
              canvas.style.cursor = 'default';
            }
          },
          onClick: (event, elements, chart) => {
            const dataPoint = isEventHighLightsExeededDataPoints(elements, chart);
            
            if (dataPoint != 0) {
              if (!elements.length) return;
              const { datasetIndex, index } = elements[0];
              const clickedPoint = dataSeries[datasetIndex]?.chart_data?.[index];
              
              if (!clickedPoint) return;
              alert(clickedPoint.response_id);
            }
          },
        },
      };

      chartRef.current = new Chart(canvasRef.current, options);
    }) ();
  }, [ dataSeries, categories, ucl, lcl ]);

  return (
    <div ref={divRef}>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}