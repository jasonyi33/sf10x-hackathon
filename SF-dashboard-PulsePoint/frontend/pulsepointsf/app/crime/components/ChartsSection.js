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
import { YEAR_COMPARISON_COLORS, COMPARISON_YEARS, MONTHS } from '../constants';

const ChartsSection = ({
  categoryGroupChartData,
  timeChartData,
  dayOfWeekChartData,
  resolutionChartData,
  // Year-over-year comparison data
  yearOverYearCategoryData,
  yearOverYearTimeData,
  yearOverYearDayData,
  yearOverYearResolutionData,
  selectedMonth,
  isYearOverYearMode = true
}) => {
  // Get selected month name for display
  const selectedMonthName = MONTHS.find(m => m.value === selectedMonth)?.label || 'Unknown';
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
        {/* Crime Type Overview Chart - Year-over-Year Comparison */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.05)',
          gridColumn: '1 / -1' // Span full width for side-by-side layout
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '0.5rem',
            textAlign: 'center'
          }}>
            📊 Incidents by Crime Type - {selectedMonthName} Comparison
          </h3>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            textAlign: 'center',
            marginBottom: '1rem'
          }}>
            Comparing {selectedMonthName} {COMPARISON_YEARS.current} vs {selectedMonthName} {COMPARISON_YEARS.previous}
          </p>

          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={yearOverYearCategoryData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="category"
                stroke="#6b7280"
                fontSize={10}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                stroke="#6b7280"
                fontSize={11}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '0.875rem'
                }}
                formatter={(value, name, props) => {
                  const year = name === 'current' ? COMPARISON_YEARS.current : COMPARISON_YEARS.previous;
                  return [
                    `${value} incidents`,
                    `${year} ${props.payload.category}`
                  ];
                }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value) => value === 'current' ? `${COMPARISON_YEARS.current}` : `${COMPARISON_YEARS.previous}`}
              />
              <Bar
                dataKey="previous"
                fill={YEAR_COMPARISON_COLORS.previous}
                radius={[4, 4, 0, 0]}
                name="previous"
              />
              <Bar
                dataKey="current"
                fill={YEAR_COMPARISON_COLORS.current}
                radius={[4, 4, 0, 0]}
                name="current"
              />
            </BarChart>
          </ResponsiveContainer>

          {/* Percentage Change Indicators */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            justifyContent: 'center',
            marginTop: '1rem'
          }}>
            {yearOverYearCategoryData.map((item, index) => (
              <div key={index} style={{
                backgroundColor: '#f9fafb',
                padding: '0.25rem 0.5rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: item.change.startsWith('+') ? '#059669' : item.change.startsWith('-') ? '#dc2626' : '#6b7280'
              }}>
                {item.category}: <strong>{item.change}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Time Distribution Chart - Year-over-Year */}
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
            marginBottom: '0.5rem',
            textAlign: 'center'
          }}>
            🕐 24-Hour Crime Pattern - {selectedMonthName}
          </h3>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            textAlign: 'center',
            marginBottom: '1rem'
          }}>
            {COMPARISON_YEARS.current} vs {COMPARISON_YEARS.previous}
          </p>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={yearOverYearTimeData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="hour"
                stroke="#6b7280"
                fontSize={10}
                interval={1}
              />
              <YAxis
                stroke="#6b7280"
                fontSize={11}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '0.875rem'
                }}
                formatter={(value, name, props) => {
                  const year = name === 'current' ? COMPARISON_YEARS.current : COMPARISON_YEARS.previous;
                  return [
                    `${value} incidents`,
                    `${year} - ${props.payload.hour}`
                  ];
                }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value) => value === 'current' ? `${COMPARISON_YEARS.current}` : `${COMPARISON_YEARS.previous}`}
              />
              <Bar
                dataKey="previous"
                fill={YEAR_COMPARISON_COLORS.previous}
                radius={[2, 2, 0, 0]}
                name="previous"
              />
              <Bar
                dataKey="current"
                fill={YEAR_COMPARISON_COLORS.current}
                radius={[2, 2, 0, 0]}
                name="current"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Second Row of Charts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
        gap: '2rem'
      }}>
        {/* Day of Week Pattern Chart - Year-over-Year */}
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
            marginBottom: '0.5rem',
            textAlign: 'center'
          }}>
            📅 Weekly Crime Distribution - {selectedMonthName}
          </h3>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            textAlign: 'center',
            marginBottom: '1rem'
          }}>
            {COMPARISON_YEARS.current} vs {COMPARISON_YEARS.previous}
          </p>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={yearOverYearDayData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
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
                formatter={(value, name, props) => {
                  const year = name === 'current' ? COMPARISON_YEARS.current : COMPARISON_YEARS.previous;
                  return [
                    `${value} incidents`,
                    `${year} - ${props.payload.fullDay}`
                  ];
                }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value) => value === 'current' ? `${COMPARISON_YEARS.current}` : `${COMPARISON_YEARS.previous}`}
              />
              <Bar
                dataKey="previous"
                fill={YEAR_COMPARISON_COLORS.previous}
                radius={[4, 4, 0, 0]}
                name="previous"
              />
              <Bar
                dataKey="current"
                fill={YEAR_COMPARISON_COLORS.current}
                radius={[4, 4, 0, 0]}
                name="current"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Resolution Status Chart - Year-over-Year */}
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
            marginBottom: '0.5rem',
            textAlign: 'center'
          }}>
            ✅ Case Resolution Status - {selectedMonthName}
          </h3>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            textAlign: 'center',
            marginBottom: '1rem'
          }}>
            {COMPARISON_YEARS.current} vs {COMPARISON_YEARS.previous}
          </p>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={yearOverYearResolutionData}
              margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="name"
                stroke="#6b7280"
                fontSize={10}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                stroke="#6b7280"
                fontSize={11}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '0.875rem'
                }}
                formatter={(value, name, props) => {
                  const year = name === 'current' ? COMPARISON_YEARS.current : COMPARISON_YEARS.previous;
                  return [
                    `${value} cases`,
                    `${year} - ${props.payload.fullName}`
                  ];
                }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value) => value === 'current' ? `${COMPARISON_YEARS.current}` : `${COMPARISON_YEARS.previous}`}
              />
              <Bar
                dataKey="previous"
                fill={YEAR_COMPARISON_COLORS.previous}
                radius={[4, 4, 0, 0]}
                name="previous"
              />
              <Bar
                dataKey="current"
                fill={YEAR_COMPARISON_COLORS.current}
                radius={[4, 4, 0, 0]}
                name="current"
              />
            </BarChart>
          </ResponsiveContainer>

          {/* Percentage Change Indicators for Resolution */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            justifyContent: 'center',
            marginTop: '1rem'
          }}>
            {yearOverYearResolutionData.slice(0, 4).map((item, index) => (
              <div key={index} style={{
                backgroundColor: '#f9fafb',
                padding: '0.25rem 0.5rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: item.change.startsWith('+') ? '#059669' : item.change.startsWith('-') ? '#dc2626' : '#6b7280'
              }}>
                {item.name}: <strong>{item.change}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartsSection;
