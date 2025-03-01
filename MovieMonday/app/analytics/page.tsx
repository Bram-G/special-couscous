// app/analytics/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Spinner, Tabs, Tab, Card } from "@heroui/react";
import { BarChart2, Users, Film, Clock, Award, Tv2 } from "lucide-react";
import { title } from "@/components/primitives";
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from "@/components/protectedRoute";
import { AnalyticsCard } from '@/components/analytics/AnalyticsCard';
import { BarChartComponent } from '@/components/analytics/BarChartComponent';
import { PieChartComponent } from '@/components/analytics/PieChartComponent';
import { LineChartComponent } from '@/components/analytics/LineChartComponent';
import { useRouter } from 'next/navigation';
import { 
  MovieMonday, 
  getActorAnalytics, 
  getDirectorAnalytics, 
  getGenreAnalytics, 
  getWinRateAnalytics,
  getTimeBasedAnalytics,
  getPickerAnalytics
} from '@/utils/analyticsUtils';

// Placeholder data for initial render or when real data is unavailable
const PLACEHOLDER_DATA = {
  actors: [
    { name: "Tom Hanks", value: 5 },
    { name: "Meryl Streep", value: 4 },
    { name: "Leonardo DiCaprio", value: 3 },
    { name: "Viola Davis", value: 3 },
    { name: "Brad Pitt", value: 2 }
  ],
  directors: [
    { name: "Steven Spielberg", value: 3 },
    { name: "Christopher Nolan", value: 2 },
    { name: "Greta Gerwig", value: 2 },
    { name: "Martin Scorsese", value: 1 },
    { name: "Bong Joon-ho", value: 1 }
  ],
  genres: [
    { name: "Drama", value: 12 },
    { name: "Comedy", value: 8 },
    { name: "Action", value: 7 },
    { name: "Sci-Fi", value: 5 },
    { name: "Horror", value: 3 }
  ],
  monthlyMovies: [
    { name: "Jan 2024", value: 4 },
    { name: "Feb 2024", value: 4 },
    { name: "Mar 2024", value: 5 },
    { name: "Apr 2024", value: 3 },
    { name: "May 2024", value: 4 }
  ],
  rejectedMovies: [
    { name: "The Room", value: 80 },
    { name: "Twilight", value: 70 },
    { name: "Batman & Robin", value: 60 },
    { name: "Catwoman", value: 50 },
    { name: "Troll 2", value: 40 }
  ],
  pickerSuccess: [
    { name: "Alice", value: 75 },
    { name: "Bob", value: 60 },
    { name: "Charlie", value: 40 },
    { name: "Diana", value: 30 }
  ]
};

export default function AnalyticsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [movieData, setMovieData] = useState<MovieMonday[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("overview");

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

  const renderAnalyticsContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center mt-10 h-64">
          <Spinner size="lg" />
        </div>
      );
    }

    // If we have real data, use it. Otherwise, show placeholder with a note
    const hasData = movieData.length > 0;
    const placeholderNote = !hasData && (
      <div className="bg-warning-100 text-warning-800 p-3 rounded mb-6">
        <p className="text-sm">
          <strong>Note:</strong> Displaying sample data. Real analytics will appear once you've completed more Movie Monday sessions.
        </p>
      </div>
    );
    
    // Select data based on current tab
    const renderOverviewTab = () => {
      // Use real data if available, otherwise use placeholder
      const genreData = hasData 
        ? getGenreAnalytics(movieData).genreDistribution.slice(0, 5)
        : PLACEHOLDER_DATA.genres;
        
      const actorData = hasData 
        ? getActorAnalytics(movieData).topActors.slice(0, 5)
        : PLACEHOLDER_DATA.actors;
        
      const timeData = hasData 
        ? getTimeBasedAnalytics(movieData).monthlyMovies.slice(-6)
        : PLACEHOLDER_DATA.monthlyMovies;
        
      const winRateData = hasData 
        ? getWinRateAnalytics(movieData).mostLosses.slice(0, 5).map(item => ({
            name: item.name,
            value: item.lossRate
          }))
        : PLACEHOLDER_DATA.rejectedMovies;
      
      return (
        <>
          {placeholderNote}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <AnalyticsCard 
              title="Movies Watched Over Time" 
              linkTo={selectedKey === "overview" ? "#trends" : undefined}
              subtitle="Monthly movie count"
            >
              <LineChartComponent
                data={timeData}
                lines={[{ dataKey: "value", color: "#8884d8", name: "Movies" }]}
                height={220}
              />
            </AnalyticsCard>
            
            <AnalyticsCard 
              title="Genre Breakdown" 
              linkTo={selectedKey === "overview" ? "#genres" : undefined}
              subtitle="Most watched genres"
            >
              <PieChartComponent
                data={genreData}
                height={220}
              />
            </AnalyticsCard>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnalyticsCard 
              title="Most Frequent Actors" 
              linkTo={selectedKey === "overview" ? "#actors" : undefined}
              subtitle="Actors that appear most often"
            >
              <BarChartComponent
                data={actorData}
                barColor="#4f46e5"
                height={220}
              />
            </AnalyticsCard>
            
            <AnalyticsCard 
              title="Most Rejected Movies" 
              linkTo={selectedKey === "overview" ? "#movies" : undefined}
              subtitle="Movies with highest loss rates"
            >
              <BarChartComponent
                data={winRateData}
                barColor="#f97316"
                height={220}
              />
            </AnalyticsCard>
          </div>
        </>
      );
    };
    
    const renderActorsTab = () => {
      const actorData = hasData 
        ? getActorAnalytics(movieData)
        : { 
            topActors: PLACEHOLDER_DATA.actors, 
            totalUniqueActors: 15, 
            totalActors: 25 
          };
      
      return (
        <>
          {placeholderNote}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-6 text-center">
              <h3 className="text-2xl font-bold text-primary">
                {actorData.totalActors}
              </h3>
              <p className="text-default-600">Total Actor Appearances</p>
            </Card>
            
            <Card className="p-6 text-center">
              <h3 className="text-2xl font-bold text-primary">
                {actorData.totalUniqueActors}
              </h3>
              <p className="text-default-600">Unique Actors</p>
            </Card>
            
            <Card className="p-6 text-center">
              <h3 className="text-2xl font-bold text-primary">
                {actorData.topActors.length > 0 ? actorData.topActors[0].name : 'N/A'}
              </h3>
              <p className="text-default-600">Most Frequent Actor</p>
            </Card>
          </div>
          
          <AnalyticsCard 
            title="Most Frequent Actors" 
            subtitle="Actors that appear most often in your watched movies"
          >
            <BarChartComponent
              data={actorData.topActors}
              barColor="#4f46e5"
              height={400}
              xAxisLabel="Actors"
              yAxisLabel="Appearances"
            />
          </AnalyticsCard>
        </>
      );
    };
    
    const renderDirectorsTab = () => {
      const directorData = hasData 
        ? getDirectorAnalytics(movieData)
        : { 
            topDirectors: PLACEHOLDER_DATA.directors, 
            totalUniqueDirectors: 8, 
            totalDirectors: 10 
          };
      
      return (
        <>
          {placeholderNote}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-6 text-center">
              <h3 className="text-2xl font-bold text-primary">
                {directorData.totalDirectors}
              </h3>
              <p className="text-default-600">Total Movies by Director</p>
            </Card>
            
            <Card className="p-6 text-center">
              <h3 className="text-2xl font-bold text-primary">
                {directorData.totalUniqueDirectors}
              </h3>
              <p className="text-default-600">Unique Directors</p>
            </Card>
            
            <Card className="p-6 text-center">
              <h3 className="text-2xl font-bold text-primary">
                {directorData.topDirectors.length > 0 ? directorData.topDirectors[0].name : 'N/A'}
              </h3>
              <p className="text-default-600">Most Frequent Director</p>
            </Card>
          </div>
          
          <AnalyticsCard 
            title="Most Frequent Directors" 
            subtitle="Directors whose films you've watched most often"
          >
            <BarChartComponent
              data={directorData.topDirectors}
              barColor="#0ea5e9"
              height={400}
              xAxisLabel="Directors"
              yAxisLabel="Movies"
            />
          </AnalyticsCard>
        </>
      );
    };
    
    const renderGenresTab = () => {
      const genreData = hasData 
        ? getGenreAnalytics(movieData)
        : { 
            genreDistribution: PLACEHOLDER_DATA.genres, 
            totalUniqueGenres: 5, 
            totalGenres: 35 
          };
      
      return (
        <>
          {placeholderNote}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="p-6 text-center">
              <h3 className="text-2xl font-bold text-primary">
                {genreData.totalUniqueGenres}
              </h3>
              <p className="text-default-600">Unique Genres</p>
            </Card>
            
            <Card className="p-6 text-center">
              <h3 className="text-2xl font-bold text-primary">
                {genreData.genreDistribution.length > 0 ? genreData.genreDistribution[0].name : 'N/A'}
              </h3>
              <p className="text-default-600">Most Watched Genre</p>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnalyticsCard 
              title="Genre Distribution" 
              subtitle="Breakdown of genres watched"
            >
              <PieChartComponent
                data={genreData.genreDistribution}
                height={350}
              />
            </AnalyticsCard>
            
            <AnalyticsCard 
              title="Genre Counts" 
              subtitle="Number of movies watched per genre"
            >
              <BarChartComponent
                data={genreData.genreDistribution}
                barColor="#10b981"
                height={350}
                xAxisLabel="Genres"
                yAxisLabel="Movies"
              />
            </AnalyticsCard>
          </div>
        </>
      );
    };
    
    const renderMoviesTab = () => {
      const winRateData = hasData 
        ? getWinRateAnalytics(movieData)
        : { 
            mostLosses: PLACEHOLDER_DATA.rejectedMovies.map((item, i) => ({
              id: i,
              name: item.name,
              selections: 5,
              wins: Math.floor(5 * (1 - item.value/100)),
              winRate: 100 - item.value,
              lossRate: item.value
            })),
            highestWinRate: PLACEHOLDER_DATA.rejectedMovies.map((item, i) => ({
              id: i,
              name: `Popular Movie ${i+1}`,
              selections: 5,
              wins: 4,
              winRate: 80,
              lossRate: 20
            })).reverse()
          };
      
      return (
        <>
          {placeholderNote}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <AnalyticsCard 
              title="Most Rejected Movies" 
              subtitle="Movies that lose the most when selected"
            >
              <BarChartComponent
                data={winRateData.mostLosses.map(item => ({
                  name: item.name,
                  value: item.lossRate
                }))}
                barColor="#f97316"
                height={350}
                xAxisLabel="Movies"
                yAxisLabel="Loss Rate (%)"
              />
            </AnalyticsCard>
            
            <AnalyticsCard 
              title="Highest Win Rate Movies" 
              subtitle="Movies most likely to win when selected"
            >
              <BarChartComponent
                data={winRateData.highestWinRate.map(item => ({
                  name: item.name,
                  value: item.winRate
                }))}
                barColor="#22c55e"
                height={350}
                xAxisLabel="Movies"
                yAxisLabel="Win Rate (%)"
              />
            </AnalyticsCard>
          </div>
        </>
      );
    };
    
    const renderPickersTab = () => {
      const pickerData = hasData 
        ? getPickerAnalytics(movieData)
        : { 
            pickerSuccessRates: PLACEHOLDER_DATA.pickerSuccess.map((item, i) => ({
              id: `user-${i}`,
              name: item.name,
              selections: 10,
              wins: Math.floor(10 * (item.value/100)),
              successRate: item.value
            })),
            totalPickers: 4,
            mostSuccessful: {
              id: 'user-0',
              name: 'Alice',
              selections: 10,
              wins: 8,
              successRate: 80
            }
          };
      
      return (
        <>
          {placeholderNote}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-6 text-center">
              <h3 className="text-2xl font-bold text-primary">
                {pickerData.totalPickers}
              </h3>
              <p className="text-default-600">Total Pickers</p>
            </Card>
            
            <Card className="p-6 text-center">
              <h3 className="text-2xl font-bold text-primary">
                {pickerData.mostSuccessful ? pickerData.mostSuccessful.name : 'N/A'}
              </h3>
              <p className="text-default-600">Most Successful Picker</p>
            </Card>
            
            <Card className="p-6 text-center">
              <h3 className="text-2xl font-bold text-primary">
                {pickerData.mostSuccessful ? `${pickerData.mostSuccessful.successRate.toFixed(0)}%` : 'N/A'}
              </h3>
              <p className="text-default-600">Best Success Rate</p>
            </Card>
          </div>
          
          <AnalyticsCard 
            title="Picker Success Rates" 
            subtitle="How often each picker's selection wins"
          >
            <BarChartComponent
              data={pickerData.pickerSuccessRates.map(item => ({
                name: item.name,
                value: item.successRate
              }))}
              barColor="#8b5cf6"
              height={350}
              xAxisLabel="Pickers"
              yAxisLabel="Success Rate (%)"
            />
          </AnalyticsCard>
        </>
      );
    };
    
    const renderTrendsTab = () => {
      const timeData = hasData 
        ? getTimeBasedAnalytics(movieData)
        : { 
            monthlyMovies: PLACEHOLDER_DATA.monthlyMovies,
            totalMoviesWatched: 20
          };
      
      return (
        <>
          {placeholderNote}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="p-6 text-center">
              <h3 className="text-2xl font-bold text-primary">
                {timeData.totalMoviesWatched}
              </h3>
              <p className="text-default-600">Total Movies Watched</p>
            </Card>
            
            <Card className="p-6 text-center">
              <h3 className="text-2xl font-bold text-primary">
                {timeData.monthlyMovies.length > 0 
                  ? (timeData.totalMoviesWatched / timeData.monthlyMovies.length).toFixed(1) 
                  : 'N/A'}
              </h3>
              <p className="text-default-600">Average Movies per Month</p>
            </Card>
          </div>
          
          <AnalyticsCard 
            title="Movies Watched Over Time" 
            subtitle="Monthly movie viewing trends"
          >
            <LineChartComponent
              data={timeData.monthlyMovies}
              lines={[{ dataKey: "value", color: "#8884d8", name: "Movies" }]}
              height={350}
              xAxisLabel="Month"
              yAxisLabel="Movies Watched"
            />
          </AnalyticsCard>
        </>
      );
    };

    // Return the appropriate tab content based on selected key
    switch (selectedKey) {
      case 'overview':
        return renderOverviewTab();
      case 'actors':
        return renderActorsTab();
      case 'directors':
        return renderDirectorsTab();
      case 'genres':
        return renderGenresTab();
      case 'movies':
        return renderMoviesTab();
      case 'pickers':
        return renderPickersTab();
      case 'trends':
        return renderTrendsTab();
      default:
        return renderOverviewTab();
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6 w-full">
        <div className="flex items-center gap-3">
          <BarChart2 className="w-8 h-8 text-primary" />
          <h1 className={title()}>Movie Analytics</h1>
        </div>
        
        <p className="text-default-600 max-w-3xl">
          Explore insights from your Movie Monday sessions. See which genres, actors, and directors 
          appear most often in your selections, and discover interesting trends about your movie watching habits.
        </p>
        
        <Tabs 
          aria-label="Analytics tabs" 
          selectedKey={selectedKey}
          onSelectionChange={(key) => setSelectedKey(key as string)}
          classNames={{
            tabList: "gap-4"
          }}
        >
          <Tab
            key="overview"
            title={
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4" />
                <span>Overview</span>
              </div>
            }
          >
            {renderAnalyticsContent()}
          </Tab>
          
          <Tab
            key="actors"
            title={
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Actors</span>
              </div>
            }
          >
            {renderAnalyticsContent()}
          </Tab>
          
          <Tab
            key="directors"
            title={
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4" />
                <span>Directors</span>
              </div>
            }
          >
            {renderAnalyticsContent()}
          </Tab>
          
          <Tab
            key="genres"
            title={
              <div className="flex items-center gap-2">
                <Tv2 className="w-4 h-4" />
                <span>Genres</span>
              </div>
            }
          >
            {renderAnalyticsContent()}
          </Tab>
          
          <Tab
            key="movies"
            title={
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span>Win Rates</span>
              </div>
            }
          >
            {renderAnalyticsContent()}
          </Tab>
          
          <Tab
            key="pickers"
            title={
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Pickers</span>
              </div>
            }
          >
            {renderAnalyticsContent()}
          </Tab>
          
          <Tab
            key="trends"
            title={
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Trends</span>
              </div>
            }
          >
            {renderAnalyticsContent()}
          </Tab>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}