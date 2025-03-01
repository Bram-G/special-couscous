// components/DashboardAnalyticsWidget.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Spinner } from "@heroui/react";
import { BarChart2, ExternalLink } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PieChartComponent } from './analytics/PieChartComponent';
import {BarChartComponent} from './analytics/BarChartComponent';
import { getGenreAnalytics, getWinRateAnalytics, MovieMonday } from '@/utils/analyticsUtils';

const PLACEHOLDER_DATA = [
  { name: "Action", value: 40 },
  { name: "Comedy", value: 30 }, 
  { name: "Drama", value: 20 },
  { name: "Horror", value: 10 },
];

const DashboardAnalyticsWidget = () => {
  const { token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [movieData, setMovieData] = useState<MovieMonday[]>([]);
  const [currentChart, setCurrentChart] = useState<'genres' | 'win-rates'>('genres');

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      setLoading(true);
      try {
        // This would be replaced with a real API call to fetch movie data
        const response = await fetch('http://localhost:8000/api/movie-monday/all', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setMovieData(data);
        }
      } catch (error) {
        console.error('Error fetching movie data for analytics:', error);
        // Use placeholder data for demo
        setMovieData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      );
    }

    // If we have real data, use it. Otherwise, show placeholder
    const hasData = movieData.length > 0;
    
    if (currentChart === 'genres') {
      const genreData = hasData 
        ? getGenreAnalytics(movieData).genreDistribution 
        : PLACEHOLDER_DATA;
      
      return (
        <PieChartComponent 
          data={genreData} 
          height={250}
          emptyStateMessage="Watch more movies to see genre breakdown"
        />
      );
    } else {
      const winRateData = hasData 
        ? getWinRateAnalytics(movieData).mostLosses.map(item => ({
            name: item.name,
            value: item.lossRate
          }))
        : [
            { name: "The Room", value: 80 },
            { name: "Twilight", value: 70 },
            { name: "Batman & Robin", value: 60 },
            { name: "Catwoman", value: 50 },
            { name: "Troll 2", value: 40 }
          ];
      
      return (
        <BarChartComponent 
          data={winRateData.slice(0, 5)} 
          barColor="#f97316"
          height={250}
          emptyStateMessage="More data needed to show win rates"
        />
      );
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Your Movie Analytics</h3>
          <p className="text-sm text-default-500">
            Insights from your Movie Monday sessions
          </p>
        </div>
        <Button
          color="primary"
          variant="light"
          endContent={<ExternalLink className="h-4 w-4" />}
          onPress={() => router.push('/analytics')}
        >
          Full Analytics
        </Button>
      </CardHeader>
      
      <CardBody>
        <div className="flex gap-4 mb-4">
          <Button
            variant={currentChart === 'genres' ? "solid" : "light"}
            color={currentChart === 'genres' ? "primary" : "default"}
            onPress={() => setCurrentChart('genres')}
          >
            Genre Breakdown
          </Button>
          <Button
            variant={currentChart === 'win-rates' ? "solid" : "light"}
            color={currentChart === 'win-rates' ? "primary" : "default"}
            onPress={() => setCurrentChart('win-rates')}
          >
            Most Rejected Movies
          </Button>
        </div>
        
        <div className="w-full">
          {renderChart()}
        </div>
      </CardBody>
    </Card>
  );
};

export default DashboardAnalyticsWidget;