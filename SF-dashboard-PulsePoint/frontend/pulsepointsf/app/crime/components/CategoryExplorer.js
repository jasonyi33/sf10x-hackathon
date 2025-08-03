/**
 * ==================================================================================
 * Category Explorer Component
 * ==================================================================================
 *
 * Comprehensive crime category explorer with grouping and detailed stats
 * Enhanced with mini bar charts for each category group
 */

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

const CategoryGroup = ({ title, icon, categories, color, bgColor, borderColor }) => {
  if (categories.length === 0) return null;

  // Prepare chart data from categories
  const chartData = categories.map(category => ({
    name: category.name.length > 15 ? category.name.substring(0, 15) + '...' : category.name,
    fullName: category.name,
    count: category.count,
    percentage: category.percentage
  }));

  return (
    <div style={{
      backgroundColor: bgColor,
      border: `1px solid ${borderColor}`,
      borderRadius: '8px',
      padding: '1rem'
    }}>
      <h3 style={{
        fontSize: '1rem',
        fontWeight: '600',
        color: color,
        marginBottom: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        {icon} {title} ({categories.length})
      </h3>

      {/* Mini Bar Chart */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '6px',
        padding: '0.75rem',
        marginBottom: '1rem',
        border: '1px solid #f3f4f6'
      }}>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#6b7280' }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#6b7280' }}
              width={30}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                fontSize: '0.75rem',
                padding: '0.5rem'
              }}
              formatter={(value, name, props) => [
                `${value} incidents (${props.payload.percentage}%)`,
                props.payload.fullName
              ]}
              labelStyle={{ display: 'none' }}
            />
            <Bar
              dataKey="count"
              fill={color}
              radius={[2, 2, 0, 0]}
              opacity={0.8}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Category Details List */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        {categories.map((category, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.5rem',
              backgroundColor: '#ffffff',
              borderRadius: '4px',
              fontSize: '0.875rem'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '2px',
                  backgroundColor: category.color
                }}
              ></div>
              <span style={{ fontWeight: '500', color: '#1f2937' }}>
                {category.name}
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <span style={{ fontWeight: '600', color: color }}>
                {category.count}
              </span>
              <span style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                backgroundColor: '#f3f4f6',
                padding: '0.125rem 0.375rem',
                borderRadius: '4px'
              }}>
                {category.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CategoryExplorer = ({ categoryExplorerData, showCategoryExplorer }) => {
  if (!showCategoryExplorer) return null;

  const totalCategories = Object.values(categoryExplorerData).flat().length;

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '2rem',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      animation: 'fadeIn 0.3s ease-in-out'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: '#1f2937',
          marginBottom: '0.5rem'
        }}>
          🏷️ Crime Category Explorer
        </h2>
        <p style={{
          fontSize: '0.875rem',
          color: '#6b7280',
          margin: '0'
        }}>
          Comprehensive breakdown of all {totalCategories} unique crime categories
        </p>
      </div>

      {/* Category Groups Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem'
      }}>
        <CategoryGroup
          title="Violent Crimes"
          icon="⚠️"
          categories={categoryExplorerData.violent}
          color="#dc2626"
          bgColor="#fef2f2"
          borderColor="#fecaca"
        />

        <CategoryGroup
          title="Property Crimes"
          icon="🏠"
          categories={categoryExplorerData.property}
          color="#d97706"
          bgColor="#fef3c7"
          borderColor="#fcd34d"
        />

        <CategoryGroup
          title="Drug Offenses"
          icon="💊"
          categories={categoryExplorerData.drug}
          color="#0284c7"
          bgColor="#f0f9ff"
          borderColor="#7dd3fc"
        />

        <CategoryGroup
          title="Public Order"
          icon="🚔"
          categories={categoryExplorerData.publicOrder}
          color="#7c3aed"
          bgColor="#f3e8ff"
          borderColor="#c084fc"
        />

        <CategoryGroup
          title="Other & Miscellaneous"
          icon="📋"
          categories={categoryExplorerData.other}
          color="#4b5563"
          bgColor="#f9fafb"
          borderColor="#d1d5db"
        />
      </div>
    </div>
  );
};

export default CategoryExplorer;
