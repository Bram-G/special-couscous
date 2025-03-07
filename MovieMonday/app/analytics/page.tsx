"use client";

import React, { useState, useEffect } from "react";
import { Spinner, Tabs, Tab, Card } from "@heroui/react";
import { BarChart2, Users, Film, Clock, Award, Tv2, Utensils } from "lucide-react";
import { title } from "@/components/primitives";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/protectedRoute";
import { AnalyticsCard } from "@/components/analytics/AnalyticsCard";
import { BarChartComponent } from "@/components/analytics/BarChartComponent";
import { PieChartComponent } from "@/components/analytics/PieChartComponent";
import { LineChartComponent } from "@/components/analytics/LineChartComponent";
import { useSearchParams } from "next/navigation";

import { useRouter } from "next/navigation";
import {
  MovieMonday,
  getActorAnalytics,
  getDirectorAnalytics,
  getGenreAnalytics,
  getWinRateAnalytics,
  getTimeBasedAnalytics,
  getPickerAnalytics,
} from "@/utils/analyticsUtils";

// Placeholder data for initial render or when real data is unavailable
const PLACEHOLDER_DATA = {
  actors: [
    { name: "Tom Hanks", value: 5 },
    { name: "Meryl Streep", value: 4 },
    { name: "Leonardo DiCaprio", value: 3 },
    { name: "Viola Davis", value: 3 },
    { name: "Brad Pitt", value: 2 },
  ],
  directors: [
    { name: "Steven Spielberg", value: 3 },
    { name: "Christopher Nolan", value: 2 },
    { name: "Greta Gerwig", value: 2 },
    { name: "Martin Scorsese", value: 1 },
    { name: "Bong Joon-ho", value: 1 },
  ],
  winningDirectors: [
    { name: "Christopher Nolan", value: 2 },
    { name: "Greta Gerwig", value: 1 },
    { name: "Martin Scorsese", value: 1 },
    { name: "Denis Villeneuve", value: 1 },
    { name: "Jordan Peele", value: 1 },
  ],
  winningActors: [
    { name: "Cillian Murphy", value: 2 },
    { name: "Ryan Gosling", value: 2 },
    { name: "Margot Robbie", value: 1 },
    { name: "Viola Davis", value: 1 },
    { name: "Leonardo DiCaprio", value: 1 },
  ],
  genres: [
    { name: "Drama", value: 12 },
    { name: "Comedy", value: 8 },
    { name: "Action", value: 7 },
    { name: "Sci-Fi", value: 5 },
    { name: "Horror", value: 3 },
  ],
  monthlyMovies: [
    { name: "Jan 2024", value: 4 },
    { name: "Feb 2024", value: 4 },
    { name: "Mar 2024", value: 5 },
    { name: "Apr 2024", value: 3 },
    { name: "May 2024", value: 4 },
  ],
  rejectedMovies: [
    { name: "The Room", value: 3 },
    { name: "Cats", value: 2 },
    { name: "Batman & Robin", value: 2 },
    { name: "Twilight", value: 1 },
    { name: "Catwoman", value: 1 },
  ],
  winningMovies: [
    { name: "Oppenheimer", value: 2 },
    { name: "Barbie", value: 1 },
    { name: "Parasite", value: 1 },
    { name: "Everything Everywhere All at Once", value: 1 },
    { name: "Dune", value: 1 },
  ],
  pickerStats: [
    { name: "Alice", value: 3, selections: 4 },
    { name: "Bob", value: 2, selections: 3 },
    { name: "Charlie", value: 1, selections: 4 },
    { name: "Diana", value: 1, selections: 3 },
  ],
};

export default function AnalyticsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [movieData, setMovieData] = useState<MovieMonday[]>([]);

  // Use search params to handle tab navigation from dashboard
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  // Map URL parameter to tab key
  const getInitialTab = () => {
    switch (tabParam) {
      case "genres":
        return "genres";
      case "directors":
        return "directors";
      case "actors":
        return "actors";
      case "movies":
        return "movies";
      case "pickers":
        return "pickers";
      case "trends":
        return "trends";
      default:
        return "overview";
    }
  };

  const [selectedKey, setSelectedKey] = useState<string>(getInitialTab());

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      setLoading(true);
      try {
        // This would be replaced with a real API call to fetch movie data
        const response = await fetch(
          "http://localhost:8000/api/movie-monday/all",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setMovieData(data);
        }
      } catch (error) {
        console.error("Error fetching movie data for analytics:", error);
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
          <strong>Note:</strong> Displaying sample data. Real analytics will
          appear once you've completed more Movie Monday sessions.
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
        ? getWinRateAnalytics(movieData)
            .mostLosses.slice(0, 5)
            .map((item) => ({
              name: item.name,
              value: item.selections - item.wins, // Use absolute values instead of rates
            }))
        : PLACEHOLDER_DATA.rejectedMovies;

      return (
        <>
          {placeholderNote}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <AnalyticsCard
              title="Movies Watched Over Time"
              linkTo="#"
              subtitle="Monthly movie count"
              className="cursor-pointer"
              onClick={() => setSelectedKey("trends")}
            >
              <LineChartComponent
                data={timeData}
                lines={[{ dataKey: "value", color: "#8884d8", name: "Movies" }]}
                height={350}
              />
            </AnalyticsCard>

            <AnalyticsCard
              title="Genre Breakdown"
              linkTo="#"
              subtitle="Most watched genres"
              className="cursor-pointer"
              onClick={() => setSelectedKey("genres")}
            >
              <PieChartComponent data={genreData} height={350} />
            </AnalyticsCard>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnalyticsCard
              title="Most Frequent Actors"
              linkTo="#"
              subtitle="Actors that appear most often"
              className="cursor-pointer"
              onClick={() => setSelectedKey("actors")}
            >
              <BarChartComponent
                data={actorData}
                barColor="#4f46e5"
                height={350}
              />
            </AnalyticsCard>

            <AnalyticsCard
              title="Most Rejected Movies"
              linkTo="#"
              subtitle="Movies with highest rejection counts"
              className="cursor-pointer"
              onClick={() => setSelectedKey("movies")}
            >
              <BarChartComponent
                data={winRateData}
                barColor="#f97316"
                height={350}
                dataKey="value" // Explicitly set the dataKey
              />
            </AnalyticsCard>
          </div>
        </>
      );
    };
    const renderActorsTab = () => {
      // Updated to show top actors and losing actors
      const actorData = hasData
        ? getActorAnalytics(movieData)
        : {
            topActors: PLACEHOLDER_DATA.actors,
            topWinningActors: PLACEHOLDER_DATA.winningActors,
            topLosingActors: PLACEHOLDER_DATA.actors.map((item, i) => ({
              name: `${item.name} ${i % 2 === 0 ? "👎" : ""}`,
              value: Math.floor(item.value * 0.7),
            })),
            totalUniqueActors: 15,
            totalActors: 25,
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
                {actorData.topLosingActors.length > 0
                  ? actorData.topLosingActors[0].name
                  : "N/A"}
              </h3>
              <p className="text-default-600">Most Frequently Rejected Actor</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnalyticsCard
              title="Actors in Rejected Movies"
              subtitle="Actors that appear most often in movies that lost voting"
            >
              <BarChartComponent
                data={actorData.topLosingActors}
                barColor="#f97316"
                height={350}
                xAxisLabel="Actors"
                yAxisLabel="Number of Rejections"
                maxBars={15}
                scrollable={true}
              />
            </AnalyticsCard>

            <AnalyticsCard
              title="Actors in Winning Movies"
              subtitle="Actors that appear most often in movies that won voting"
            >
              <BarChartComponent
                data={actorData.topWinningActors}
                barColor="#8b5cf6"
                height={350}
                xAxisLabel="Actors"
                yAxisLabel="Number of Winning Movies"
                maxBars={15}
                scrollable={true}
              />
            </AnalyticsCard>
          </div>
        </>
      );
    };

    const renderDirectorsTab = () => {
      // Updated to show directors and winning directors
      const directorData = hasData
        ? getDirectorAnalytics(movieData)
        : {
            topDirectors: PLACEHOLDER_DATA.directors,
            topWinningDirectors: PLACEHOLDER_DATA.winningDirectors,
            totalUniqueDirectors: 8,
            totalDirectors: 10,
          };

      return (
        <>
          {placeholderNote}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-6 text-center">
              <h3 className="text-2xl font-bold text-primary">
                {directorData.totalDirectors}
              </h3>
              <p className="text-default-600">Total Directors</p>
            </Card>

            <Card className="p-6 text-center">
              <h3 className="text-2xl font-bold text-primary">
                {directorData.totalUniqueDirectors}
              </h3>
              <p className="text-default-600">Unique Directors</p>
            </Card>

            <Card className="p-6 text-center">
              <h3 className="text-2xl font-bold text-primary">
                {directorData.topWinningDirectors.length > 0
                  ? directorData.topWinningDirectors[0].name
                  : "N/A"}
              </h3>
              <p className="text-default-600">Most Successful Director</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnalyticsCard
              title="Most Frequent Directors"
              subtitle="Directors whose films have not been picked"
            >
              <BarChartComponent
                data={directorData.topDirectors}
                barColor="#0ea5e9"
                height={350}
                xAxisLabel="Directors"
                yAxisLabel="Number of Movies"
                maxBars={15} // Show top 15 directors
              />
            </AnalyticsCard>

            <AnalyticsCard
              title="Directors of Winning Movies"
              subtitle="Directors with the most winning films"
            >
              <BarChartComponent
                data={directorData.topWinningDirectors}
                barColor="#06b6d4"
                height={350}
                xAxisLabel="Directors"
                yAxisLabel="Number of Winning Movies"
                maxBars={15} // Show top 15 winning directors
              />
            </AnalyticsCard>
          </div>
        </>
      );
    };

    const renderGenresTab = () => {
      // Updated to show genre distribution and winning genres
      const genreData = hasData
        ? getGenreAnalytics(movieData)
        : {
            genreDistribution: PLACEHOLDER_DATA.genres,
            genreWins: PLACEHOLDER_DATA.genres.map((g) => ({
              name: g.name,
              value: Math.max(1, Math.floor(g.value * 0.4)),
            })),
            totalUniqueGenres: 5,
            totalGenres: 35,
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
                {genreData.genreDistribution.length > 0
                  ? genreData.genreDistribution[0].name
                  : "N/A"}
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
                maxSlices={8} // Show top 8 genres plus "Other"
              />
            </AnalyticsCard>

            <AnalyticsCard
              title="Winning Movie Genres"
              subtitle="Genres that win voting most often"
            >
              <BarChartComponent
                data={genreData.genreWins}
                barColor="#10b981"
                height={350}
                xAxisLabel="Genres"
                yAxisLabel="Number of Winning Movies"
                maxBars={10} // Show top 10 winning genres
              />
            </AnalyticsCard>
          </div>
        </>
      );
    };

    const renderMoviesTab = () => {
      // Updated to show absolute counts of wins and losses
      const winLossData = hasData
        ? getWinRateAnalytics(movieData)
        : {
            mostLosses: PLACEHOLDER_DATA.rejectedMovies.map((item) => ({
              name: item.name,
              value: item.value,
            })),
            mostWins: PLACEHOLDER_DATA.winningMovies.map((item) => ({
              name: item.name,
              value: item.value,
            })),
          };

      return (
        <>
          {placeholderNote}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-6 text-center">
              <h3 className="text-2xl font-bold text-primary">
                {winLossData.mostLosses.reduce(
                  (sum, item) => sum + item.value,
                  0
                )}
              </h3>
              <p className="text-default-600">Total Movies</p>
            </Card>

            <Card className="p-6 text-center">
              <h3 className="text-2xl font-bold text-primary">
                {winLossData.mostWins.reduce(
                  (sum, item) => sum + item.value,
                  0
                )}
              </h3>
              <p className="text-default-600">Total Winning Movies</p>
            </Card>

            <Card className="p-6 text-center">
              <h3 className="text-2xl font-bold text-primary">
                {winLossData.mostLosses.length > 0
                  ? winLossData.mostLosses[0].name
                  : "N/A"}
              </h3>
              <p className="text-default-600">Most Rejected Movie</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <AnalyticsCard
              title="Most Rejected Movies"
              subtitle="Movies that have lost voting the most times"
            >
              <BarChartComponent
                data={winLossData.mostLosses}
                barColor="#f97316"
                height={350}
                xAxisLabel="Movies"
                yAxisLabel="Number of Rejections"
                maxBars={10} // Show top 10 most rejected
              />
            </AnalyticsCard>

            <AnalyticsCard
              title="Most Winning Movies"
              subtitle="Movies that have won voting the most times"
            >
              <BarChartComponent
                data={winLossData.mostWins}
                barColor="#22c55e"
                height={350}
                xAxisLabel="Movies"
                yAxisLabel="Number of Wins"
                maxBars={10} // Show top 10 winners
              />
            </AnalyticsCard>
          </div>
        </>
      );
    };

    const renderPickersTab = () => {
      // Updated to show picker stats with absolute counts
      const pickerData = hasData
        ? getPickerAnalytics(movieData)
        : {
            pickerStats: PLACEHOLDER_DATA.pickerStats.map((item) => ({
              id: `user-${item.name.toLowerCase()}`,
              name: item.name,
              selections: item.selections,
              wins: item.value,
            })),
            totalPickers: 4,
            mostSuccessful: {
              id: "user-alice",
              name: "Alice",
              selections: 4,
              wins: 3,
            },
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
                {pickerData.mostSuccessful
                  ? pickerData.mostSuccessful.name
                  : "N/A"}
              </h3>
              <p className="text-default-600">Most Successful Picker</p>
            </Card>

            <Card className="p-6 text-center">
              <h3 className="text-2xl font-bold text-primary">
                {pickerData.mostSuccessful
                  ? `${pickerData.mostSuccessful.wins} wins`
                  : "N/A"}
              </h3>
              <p className="text-default-600">Best Performance</p>
            </Card>
          </div>

          <AnalyticsCard
            title="Picker Performance"
            subtitle="Number of wins for each picker's movie selections"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-lg font-medium">Wins by Picker</h4>
                <BarChartComponent
                  data={pickerData.pickerStats.map((item) => ({
                    name: item.name,
                    value: item.wins,
                  }))}
                  barColor="#8b5cf6"
                  height={300}
                  xAxisLabel="Pickers"
                  yAxisLabel="Number of Wins"
                  // No maxBars since pickers are usually few
                />
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-medium">Total Selections</h4>
                <BarChartComponent
                  data={pickerData.pickerStats.map((item) => ({
                    name: item.name,
                    value: item.selections,
                  }))}
                  barColor="#6366f1"
                  height={300}
                  xAxisLabel="Pickers"
                  yAxisLabel="Number of Selections"
                />
              </div>
            </div>
          </AnalyticsCard>
        </>
      );
    };

    const renderTrendsTab = () => {
      const timeData = hasData
        ? getTimeBasedAnalytics(movieData)
        : {
            movieMondaysByMonth: PLACEHOLDER_DATA.monthlyMovies,
            monthlyMovies: PLACEHOLDER_DATA.monthlyMovies,
            totalMoviesWatched: 20,
            totalMovieMondayCount: 10,
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
                {timeData.totalMovieMondayCount}
              </h3>
              <p className="text-default-600">Total Movie Monday Events</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnalyticsCard
              title="Movie Monday Events Over Time"
              subtitle="Monthly events frequency"
            >
              <LineChartComponent
                data={timeData.movieMondaysByMonth}
                lines={[{ dataKey: "value", color: "#8884d8", name: "Events" }]}
                height={350}
                xAxisLabel="Month"
                yAxisLabel="Number of Events"
              />
            </AnalyticsCard>

            <AnalyticsCard
              title="Movies Watched Over Time"
              subtitle="Monthly movie viewing counts"
            >
              <LineChartComponent
                data={timeData.monthlyMovies}
                lines={[{ dataKey: "value", color: "#0ea5e9", name: "Movies" }]}
                height={350}
                xAxisLabel="Month"
                yAxisLabel="Movies Watched"
              />
            </AnalyticsCard>
          </div>
        </>
      );
    };

    const renderFoodDrinksTab = () => {
      const foodDrinkData = hasData
        ? getFoodDrinkAnalytics(movieData)
        : {
            topCocktails: [
              { name: "Old Fashioned", value: 5 },
              { name: "Margarita", value: 4 },
              { name: "Negroni", value: 3 },
              { name: "Manhattan", value: 2 },
              { name: "Mojito", value: 2 }
            ],
            topMeals: [
              { name: "Pizza", value: 3 },
              { name: "Tacos", value: 2 },
              { name: "Pasta", value: 2 },
              { name: "Burgers", value: 1 },
              { name: "Sushi", value: 1 }
            ],
            topDesserts: [
              { name: "Ice Cream", value: 3 },
              { name: "Chocolate Cake", value: 2 },
              { name: "Cookies", value: 2 },
              { name: "Tiramisu", value: 1 },
              { name: "Cheesecake", value: 1 }
            ],
            totalCocktails: 16,
            totalMeals: 9,
            totalDesserts: 9
          };
    
      return (
        <>
          {placeholderNote}
    
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-6 text-center">
              <h3 className="text-2xl font-bold text-secondary">
                {foodDrinkData.totalCocktails}
              </h3>
              <p className="text-default-600">Total Cocktails</p>
            </Card>
    
            <Card className="p-6 text-center">
              <h3 className="text-2xl font-bold text-primary">
                {foodDrinkData.totalMeals}
              </h3>
              <p className="text-default-600">Total Meals</p>
            </Card>
    
            <Card className="p-6 text-center">
              <h3 className="text-2xl font-bold text-danger">
                {foodDrinkData.totalDesserts}
              </h3>
              <p className="text-default-600">Total Desserts</p>
            </Card>
          </div>
    
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <AnalyticsCard
              title="Top Cocktails"
              subtitle="Most popular cocktails served"
            >
              <PieChartComponent
                data={foodDrinkData.topCocktails}
                height={350}
                colors={["#7C3AED", "#8B5CF6", "#A78BFA", "#C4B5FD", "#DDD6FE"]}
                maxSlices={6}
              />
            </AnalyticsCard>
    
            <AnalyticsCard
              title="Popular Meals"
              subtitle="Most frequent dinner choices"
            >
              <BarChartComponent
                data={foodDrinkData.topMeals}
                barColor="#0EA5E9"
                height={350}
                xAxisLabel="Meals"
                yAxisLabel="Frequency"
                maxBars={8}
              />
            </AnalyticsCard>
          </div>
    
          <AnalyticsCard
            title="Dessert Favorites"
            subtitle="Most commonly served desserts"
          >
            <div className="h-80">
              <BarChartComponent
                data={foodDrinkData.topDesserts}
                barColor="#F43F5E"
                height={350}
                xAxisLabel="Desserts"
                yAxisLabel="Frequency"
                maxBars={10}
                scrollable
              />
            </div>
          </AnalyticsCard>
        </>
      );
    };

    // Return the appropriate tab content based on selected key
    switch (selectedKey) {
      case "overview":
        return renderOverviewTab();
      case "actors":
        return renderActorsTab();
      case "directors":
        return renderDirectorsTab();
      case "genres":
        return renderGenresTab();
      case "movies":
        return renderMoviesTab();
      case "pickers":
        return renderPickersTab();
      case "trends":
        return renderTrendsTab();
      case "food":
        return renderFoodDrinksTab();
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
          Explore insights from your Movie Monday sessions. See which genres,
          actors, and directors appear most often in your selections, and
          discover interesting trends about your movie watching habits.
        </p>

        <Tabs
          aria-label="Analytics tabs"
          selectedKey={selectedKey}
          onSelectionChange={(key) => setSelectedKey(key as string)}
          classNames={{
            tabList: "gap-4",
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
          <Tab
            key="food"
            title={
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4" />
                <span>Food & Drinks</span>
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
