/**
 * ==================================================================================
 * Charts Section Component
 * ==================================================================================
 *
 * Analytics charts section with all crime data visualizations
 */

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend
} from 'recharts';

const ChartsSection = ({
  categoryChartData,
  timeChartData,
  dayOfWeekChartData,
  resolutionChartData
}) => {
  return (
    <div style={{
      marginBottom: '2rem'
    }}>
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: '1.5rem',
        textAlign: 'center'
      }}>
        📊 Crime Data Analytics
      </h2>

      {/* Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        {/* Crime Category Breakdown Chart */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.05)'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            🏷️ Incidents by Category
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={categoryChartData}
              layout="horizontal"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                type="number"
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis
                type="category"
                dataKey="category"
                stroke="#6b7280"
                fontSize={11}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '0.875rem'
                }}
                formatter={(value, name, props) => [
                  `${value} incidents (${props.payload.percentage}%)`,
                  props.payload.fullCategory
                ]}
              />
              <Bar
                dataKey="count"
                fill="#3b82f6"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Time Distribution Chart */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.05)'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            🕐 24-Hour Crime Pattern
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={timeChartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="hour"
                stroke="#6b7280"
                fontSize={11}
                interval={2}
              />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '0.875rem'
                }}
                formatter={(value, name) => [
                  `${value} incidents`,
                  'Count'
                ]}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Second Row of Charts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
        gap: '2rem'
      }}>
        {/* Day of Week Pattern Chart */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.05)'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            📅 Weekly Crime Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={dayOfWeekChartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="day"
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '0.875rem'
                }}
                formatter={(value, name, props) => [
                  `${value} incidents (${props.payload.percentage}%)`,
                  props.payload.fullDay
                ]}
              />
              <Bar
                dataKey="count"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Resolution Status Chart */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.05)'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            ✅ Case Resolution Status
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={resolutionChartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {resolutionChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '0.875rem'
                }}
                formatter={(value, name, props) => [
                  `${value} cases (${props.payload.percentage}%)`,
                  props.payload.fullName
                ]}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                fontSize={12}
                formatter={(value, entry) => entry.payload.name}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ChartsSection;
