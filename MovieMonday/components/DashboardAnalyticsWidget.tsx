import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Spinner } from "@heroui/react";
import { BarChart2, ExternalLink, Award, Film, Users } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PieChartComponent } from './analytics/PieChartComponent';
import { BarChartComponent } from './analytics/BarChartComponent';
import { getGenreAnalytics, getWinRateAnalytics, getDirectorAnalytics, getActorAnalytics, getTimeBasedAnalytics, MovieMonday } from '@/utils/analyticsUtils';

// Example placeholder data for when no real data is available
const PLACEHOLDER_DATA = {
  genres: [
    { name: "Action", value: 8 },
    { name: "Comedy", value: 6 }, 
    { name: "Drama", value: 4 },
    { name: "Horror", value: 2 },
    { name: "Sci-Fi", value: 1 },
  ],
  directors: [
    { name: "Christopher Nolan", value: 3 },
    { name: "Greta Gerwig", value: 2 },
    { name: "Martin Scorsese", value: 2 },
    { name: "Steven Spielberg", value: 1 },
    { name: "Denis Villeneuve", value: 1 }
  ],
  rejectedMovies: [
    { name: "The Room", value: 3 },
    { name: "Cats", value: 2 },
    { name: "Batman & Robin", value: 2 },
    { name: "Twilight", value: 1 },
    { name: "Catwoman", value: 1 }
  ]
};

const DashboardAnalyticsWidget = () => {
  const { token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [movieData, setMovieData] = useState<MovieMonday[]>([]);
  const [currentChart, setCurrentChart] = useState<'genres' | 'directors' | 'losses' | 'events'>('genres');

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      setLoading(true);
      try {
        // Fetch movie data from API
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

  const handleViewMore = (tab: string) => {
    router.push(`/analytics?tab=${tab}`);
  };

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
        : [
            { name: "Action", value: 8 },
            { name: "Comedy", value: 6 }, 
            { name: "Drama", value: 4 },
            { name: "Horror", value: 2 }
          ];
      
      return (
        <PieChartComponent 
          data={genreData} 
          height={250}
          emptyStateMessage="Watch more movies to see genre breakdown"
          maxSlices={4} // Limit to 4 slices plus "Other"
          hideLegend={false} // Show legend to display names
          showPercent={true} // Show percentages in the chart
        />
      );
    } else if (currentChart === 'directors') {
      const directorData = hasData 
        ? getDirectorAnalytics(movieData).topWinningDirectors
        : [
            { name: "Christopher Nolan", value: 3 },
            { name: "Greta Gerwig", value: 2 },
            { name: "Martin Scorsese", value: 2 },
            { name: "Steven Spielberg", value: 1 },
            { name: "Denis Villeneuve", value: 1 }
          ];
      
      return (
        <BarChartComponent 
          data={directorData.slice(0, 5)} 
          barColor="#0ea5e9"
          height={250}
          emptyStateMessage="More data needed to show director stats"
          maxBars={5}
          yAxisLabel="Movies Won" // Add Y-axis label
        />
      );
    } else if (currentChart === 'events') {
      const eventData = hasData 
        ? getTimeBasedAnalytics(movieData).movieMondaysByMonth
        : [
            { name: "Jan 2024", value: 4 },
            { name: "Feb 2024", value: 3 },
            { name: "Mar 2024", value: 5 },
            { name: "Apr 2024", value: 2 },
            { name: "May 2024", value: 4 }
          ];
      
      return (
        <BarChartComponent 
          data={eventData.slice(-6)} // Last 6 months
          barColor="#8b5cf6"
          height={250}
          emptyStateMessage="More data needed to show movie events"
          maxBars={6}
          yAxisLabel="Events" // Add Y-axis label
        />
      );
    } else {
      // Losses chart
      const actorLossesData = hasData 
        ? getActorAnalytics(movieData).topLosingActors
        : [
            { name: "Nicolas Cage", value: 3 },
            { name: "Adam Sandler", value: 2 },
            { name: "Jennifer Lawrence", value: 2 },
            { name: "Tom Cruise", value: 1 },
            { name: "Will Smith", value: 1 }
          ];
      
      return (
        <BarChartComponent 
          data={actorLossesData.slice(0, 5)} 
          barColor="#f97316"
          height={250}
          emptyStateMessage="More data needed to show lost actors"
          maxBars={5}
          yAxisLabel="Rejections" // Add Y-axis label
        />
      );
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 className="text-primary h-5 w-5" /> {/* Add icon */}
          <div>
            <h3 className="text-lg font-semibold">Your Movie Analytics</h3>
            <p className="text-sm text-default-500">
              Insights from your Movie Monday sessions
            </p>
          </div>
        </div>
        <Button
          color="primary"
          variant="light"
          endContent={<ExternalLink className="h-4 w-4" />}
          onPress={() => router.push('/analytics?tab=overview')}
        >
          Full Analytics
        </Button>
      </CardHeader>
      
      <CardBody>
        <div className="flex gap-4 mb-4 overflow-x-auto pb-2">
          <Button
            variant={currentChart === 'genres' ? "solid" : "light"}
            color={currentChart === 'genres' ? "primary" : "default"}
            onPress={() => setCurrentChart('genres')}
          >
            Genre Breakdown
          </Button>
          <Button
            variant={currentChart === 'directors' ? "solid" : "light"}
            color={currentChart === 'directors' ? "primary" : "default"}
            onPress={() => setCurrentChart('directors')}
            startContent={<Film className="h-4 w-4" />}
          >
            Top Directors
          </Button>
          <Button
            variant={currentChart === 'losses' ? "solid" : "light"}
            color={currentChart === 'losses' ? "primary" : "default"}
            onPress={() => setCurrentChart('losses')}
            startContent={<Users className="h-4 w-4" />}
          >
            Rejected Actors
          </Button>
          <Button
            variant={currentChart === 'events' ? "solid" : "light"}
            color={currentChart === 'events' ? "primary" : "default"}
            onPress={() => setCurrentChart('events')}
            startContent={<Award className="h-4 w-4" />}
          >
            Movie Mondays
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