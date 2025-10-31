import React from 'react'
import { Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function PieChart({ labels = [], values = [], colors = [] }) {
  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors.length ? colors : ['#60A5FA', '#FCA5A5', '#34D399', '#FBBF24'],
        borderWidth: 1,
      },
    ],
  }

  return (
    <div>
      <Pie data={data} />
    </div>
  )
}
