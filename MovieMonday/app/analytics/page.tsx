"use client";

import React, { useState, useEffect } from "react";
import { Spinner, Tabs, Tab, Card } from "@heroui/react";
import {
  BarChart2,
  Users,
  Film,
  Clock,
  Award,
  Tv2,
  Utensils,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
import { title } from "@/components/primitives";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/protectedRoute";
import { AnalyticsCard } from "@/components/analytics/AnalyticsCard";
import { BarChartComponent } from "@/components/analytics/BarChartComponent";
import { PieChartComponent } from "@/components/analytics/PieChartComponent";
import { LineChartComponent } from "@/components/analytics/LineChartComponent";
import MovieDetailsModal from "@/components/analytics/MovieDetailsModal";
import {
  MovieMonday,
  getActorAnalytics,
  getDirectorAnalytics,
  getGenreAnalytics,
  getWinRateAnalytics,
  getTimeBasedAnalytics,
  getPickerAnalytics,
  getFoodDrinkAnalytics,
  getMoviesByActor,
  getMoviesByDirector,
  getMoviesByGenre,
  getMoviesByCocktail,
  getMoviesByMeal,
} from "@/utils/analyticsUtils";

function normalizeItemName(item) {
  if (!item || typeof item !== "string") return item;

  // Check if the item appears to be JSON stringified
  if (item.startsWith("[") && item.endsWith("]")) {
    try {
      // Try to parse as JSON array
      const parsed = JSON.parse(item);

      if (Array.isArray(parsed) && parsed.length > 0) {
        // Return the first non-empty element if it's an array
        const validItems = parsed.filter(
          (p) => typeof p === "string" && p.trim(),
        );

        if (validItems.length > 0) {
          return validItems[0];
        }
      }

      // If it's somehow an empty array or invalid, return "None"
      return "None";
    } catch (e) {
      // If it's not valid JSON, remove the brackets and quotes
      return item.slice(1, -1).replace(/"/g, "");
    }
  }

  // If it's not JSON format, return as is
  return item;
}

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
  const [showMovieDetailsModal, setShowMovieDetailsModal] = useState(false);
  const [selectedMovies, setSelectedMovies] = useState<any[]>([]);
  const [selectedFilterValue, setSelectedFilterValue] = useState<string>("");
  const [selectedFilterType, setSelectedFilterType] = useState<
    "actor" | "director" | "genre" | "cocktail" | "meal"
  >("actor");
  const [modalTitle, setModalTitle] = useState<string>("");

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

  const handleChartItemClick = (
    name: string,
    type: "actor" | "director" | "genre" | "cocktail" | "meal",
    chartContext?: "winning" | "losing" | "all",
  ) => {
    if (!name || !movieData.length) return;

    let filteredMovies: any[] = [];
    let title = "";
    const winStatus =
      chartContext === "winning"
        ? true
        : chartContext === "losing"
          ? false
          : undefined; // undefined means "don't filter by win status"

    switch (type) {
      case "actor":
        filteredMovies = getMoviesByActor(movieData, name, winStatus);

        if (chartContext === "winning") {
          title = `Winning Movies featuring ${name}`;
        } else if (chartContext === "losing") {
          title = `Rejected Movies featuring ${name}`;
        } else {
          title = `Movies featuring ${name}`;
        }
        break;

      case "director":
        filteredMovies = getMoviesByDirector(movieData, name, winStatus);

        if (chartContext === "winning") {
          title = `Winning Movies directed by ${name}`;
        } else if (chartContext === "losing") {
          title = `Rejected Movies directed by ${name}`;
        } else {
          title = `Movies directed by ${name}`;
        }
        break;

      case "genre":
        filteredMovies = getMoviesByGenre(movieData, name, winStatus);

        if (chartContext === "winning") {
          title = `Winning ${name} Movies`;
        } else if (chartContext === "losing") {
          title = `Rejected ${name} Movies`;
        } else {
          title = `${name} Movies`;
        }
        break;

      case "cocktail":
        filteredMovies = getMoviesByCocktail(movieData, name);
        title = `Movies watched while serving ${name}`;
        break;

      case "meal":
        filteredMovies = getMoviesByMeal(movieData, name);
        title = `Movies watched while eating ${name}`;
        break;

      default:
        filteredMovies = [];
        title = "Movie Details";
    }

    // If no movies found with the specified filter
    if (filteredMovies.length === 0) {
      if (chartContext === "winning") {
        title = `No winning movies found for ${name}`;
      } else if (chartContext === "losing") {
        title = `No rejected movies found for ${name}`;
      } else {
        title = `No movies found for ${name}`;
      }
    }

    // Update state to show modal with filtered movies
    setSelectedMovies(filteredMovies);
    setSelectedFilterValue(name);
    setSelectedFilterType(type);
    setModalTitle(title);
    setShowMovieDetailsModal(true);
  };

  const [selectedKey, setSelectedKey] = useState<string>(getInitialTab());

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      setLoading(true);
      try {
        // This would be replaced with a real API call to fetch movie data
        const response = await fetch(
          `${API_BASE_URL}/api/movie-monday/all`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
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
              className="cursor-pointer"
              linkTo="#"
              subtitle="Monthly movie count"
              title="Movies Watched Over Time"
              onClick={() => setSelectedKey("trends")}
            >
              <LineChartComponent
                data={timeData}
                height={350}
                lines={[{ dataKey: "value", color: "#8884d8", name: "Movies" }]}
              />
            </AnalyticsCard>

            <AnalyticsCard
              className="cursor-pointer"
              linkTo="#"
              subtitle="Most watched genres"
              title="Genre Breakdown"
              onClick={() => setSelectedKey("genres")}
            >
              <PieChartComponent data={genreData} height={350} />
            </AnalyticsCard>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnalyticsCard
              className="cursor-pointer"
              linkTo="#"
              subtitle="Actors that appear most often"
              title="Most Frequent Actors"
              onClick={() => setSelectedKey("actors")}
            >
              <BarChartComponent
                barColor="#4f46e5"
                data={actorData}
                height={350}
              />
            </AnalyticsCard>

            <AnalyticsCard
              className="cursor-pointer"
              linkTo="#"
              subtitle="Movies with highest rejection counts"
              title="Most Rejected Movies"
              onClick={() => setSelectedKey("movies")}
            >
              <BarChartComponent
                barColor="#f97316"
                data={winRateData}
                dataKey="value" // Explicitly set the dataKey
                height={350}
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
            topWinningActors: PLACEHOLDER_DATA.winningActors,
            topLosingActors: PLACEHOLDER_DATA.actors.map((item, i) => ({
              name: `${item.name} ${i % 2 === 0 ? "👎" : ""}`,
              value: Math.floor(item.value * 0.7),
            })),
            mostSeenActor: PLACEHOLDER_DATA.actors[0] || {
              name: "N/A",
              value: 0,
            },
            totalUniqueActors: 15,
            totalActors: 25,
          };

      return (
        <>
          {placeholderNote}

          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-6 text-center">
              <h3 className="text-2xl font-bold text-primary">
                {actorData.totalUniqueActors}
              </h3>
              <p className="text-default-600">Unique Actors</p>
            </Card>

            <Card className="p-6 text-center">
              <h3 className="text-2xl font-bold text-primary">
                {actorData.mostSeenActor?.name || "N/A"}
              </h3>
              <p className="text-default-600">Most Seen Actor</p>
              {actorData.mostSeenActor?.value && (
                <p className="text-sm text-default-500 mt-1">
                  {actorData.mostSeenActor.value} appearances
                </p>
              )}
            </Card>

            <Card className="p-6 text-center">
              <h3 className="text-2xl font-bold text-primary">
                {actorData.topLosingActors.length > 0
                  ? actorData.topLosingActors[0].name
                  : "N/A"}
              </h3>
              <p className="text-default-600">Most Frequently Rejected Actor</p>
              {actorData.topLosingActors.length > 0 && (
                <p className="text-sm text-default-500 mt-1">
                  {actorData.topLosingActors[0].value} rejections
                </p>
              )}
            </Card>
          </div>

          {/* Charts with improved height and configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnalyticsCard
              subtitle="Actors that appear most often in movies that won voting (Top 100)"
              title="Actors in Winning Movies"
            >
              <BarChartComponent
                barColor="#10b981" // Green for winning
                data={actorData.topWinningActors}
                height={400} // Slightly increased height for better balance
                maxBars={15}
                scrollable={true}
                xAxisLabel="Actors"
                yAxisLabel="Winning Movies"
                onBarClick={(name) =>
                  handleChartItemClick(name, "actor", "winning")
                }
              />
            </AnalyticsCard>

            <AnalyticsCard
              subtitle="Actors that appear most often in movies that lost voting (Top 100)"
              title="Actors in Rejected Movies"
            >
              <BarChartComponent
                barColor="#f97316" // Orange for losing
                data={actorData.topLosingActors}
                height={400} // Slightly increased height for better balance
                maxBars={15}
                scrollable={true}
                xAxisLabel="Actors"
                yAxisLabel="Rejections"
                onBarClick={(name) =>
                  handleChartItemClick(name, "actor", "losing")
                }
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
              subtitle="Directors whose films have not been picked"
              title="Most Frequent Directors"
            >
              <BarChartComponent
                barColor="#0ea5e9"
                data={directorData.topDirectors}
                height={350}
                maxBars={15} // Show top 15 directors
                xAxisLabel="Directors"
                yAxisLabel="Number of Movies"
                onBarClick={(name) =>
                  handleChartItemClick(name, "director", "winning")
                }
              />
            </AnalyticsCard>

            <AnalyticsCard
              subtitle="Directors with the most winning films"
              title="Directors of Winning Movies"
            >
              <BarChartComponent
                barColor="#06b6d4"
                data={directorData.topWinningDirectors}
                height={350}
                maxBars={15} // Show top 15 winning directors
                xAxisLabel="Directors"
                yAxisLabel="Number of Winning Movies"
                onBarClick={(name) =>
                  handleChartItemClick(name, "director", "winning")
                }
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
              subtitle="Breakdown of genres watched"
              title="Genre Distribution"
            >
              <PieChartComponent
                data={genreData.genreDistribution}
                height={350}
                maxSlices={8} // Show top 8 genres plus "Other"
                onSliceClick={(name) =>
                  handleChartItemClick(name, "genre", "winning")
                }
              />
            </AnalyticsCard>

            <AnalyticsCard
              subtitle="Genres that win voting most often"
              title="Winning Movie Genres"
            >
              <BarChartComponent
                barColor="#10b981"
                data={genreData.genreWins}
                height={350}
                maxBars={10} // Show top 10 winning genres
                xAxisLabel="Genres"
                yAxisLabel="Number of Winning Movies"
                onBarClick={(name) =>
                  handleChartItemClick(name, "genre", "winning")
                }
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
                  0,
                )}
              </h3>
              <p className="text-default-600">Total Movies</p>
            </Card>

            <Card className="p-6 text-center">
              <h3 className="text-2xl font-bold text-primary">
                {winLossData.mostWins.reduce(
                  (sum, item) => sum + item.value,
                  0,
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
              subtitle="Movies that have lost voting the most times"
              title="Most Rejected Movies"
            >
              <BarChartComponent
                barColor="#f97316"
                data={winLossData.mostLosses}
                height={350}
                maxBars={10} // Show top 10 most rejected
                xAxisLabel="Movies"
                yAxisLabel="Number of Rejections"
              />
            </AnalyticsCard>

            <AnalyticsCard
              subtitle="Movies that have won voting the most times"
              title="Most Winning Movies"
            >
              <BarChartComponent
                barColor="#22c55e"
                data={winLossData.mostWins}
                height={350}
                maxBars={10} // Show top 10 winners
                xAxisLabel="Movies"
                yAxisLabel="Number of Wins"
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
            subtitle="Number of wins for each picker's movie selections"
            title="Picker Performance"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-lg font-medium">Wins by Picker</h4>
                <BarChartComponent
                  barColor="#8b5cf6"
                  data={pickerData.pickerStats.map((item) => ({
                    name: item.name,
                    value: item.wins,
                  }))}
                  height={300}
                  xAxisLabel="Pickers"
                  yAxisLabel="Number of Wins"
                  // No maxBars since pickers are usually few
                />
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-medium">Total Selections</h4>
                <BarChartComponent
                  barColor="#6366f1"
                  data={pickerData.pickerStats.map((item) => ({
                    name: item.name,
                    value: item.selections,
                  }))}
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
              subtitle="Monthly events frequency"
              title="Movie Monday Events Over Time"
            >
              <LineChartComponent
                data={timeData.movieMondaysByMonth}
                height={350}
                lines={[{ dataKey: "value", color: "#8884d8", name: "Events" }]}
                xAxisLabel="Month"
                yAxisLabel="Number of Events"
              />
            </AnalyticsCard>

            <AnalyticsCard
              subtitle="Monthly movie viewing counts"
              title="Movies Watched Over Time"
            >
              <LineChartComponent
                data={timeData.monthlyMovies}
                height={350}
                lines={[{ dataKey: "value", color: "#0ea5e9", name: "Movies" }]}
                xAxisLabel="Month"
                yAxisLabel="Movies Watched"
              />
            </AnalyticsCard>
          </div>
        </>
      );
    };

    const renderFoodDrinksTab = () => {
      // Define placeholder data first
      const placeholderData = {
        topCocktails: [
          { name: "Moscow Mule", value: 5 },
          { name: "Old Fashioned", value: 4 },
          { name: "Margarita", value: 3 },
          { name: "Mojito", value: 2 },
          { name: "Negroni", value: 1 },
        ],
        topMeals: [
          { name: "Pizza", value: 3 },
          { name: "Tacos", value: 2 },
          { name: "Pasta", value: 2 },
          { name: "Burgers", value: 1 },
          { name: "Sushi", value: 1 },
        ],
        topDesserts: [
          { name: "Ice Cream", value: 3 },
          { name: "Chocolate Cake", value: 2 },
          { name: "Cookies", value: 2 },
          { name: "Tiramisu", value: 1 },
          { name: "Cheesecake", value: 1 },
        ],
        totalCocktails: 15,
        totalMeals: 9,
        totalDesserts: 9,
      };

      // Check if function exists
      if (typeof getFoodDrinkAnalytics !== "function") {
        console.error("getFoodDrinkAnalytics is not a function", {
          getFoodDrinkAnalytics,
        });

        return (
          <>
            {placeholderNote}
            <div className="bg-warning-100 text-warning-800 p-3 rounded mb-6">
              <p className="text-sm">
                <strong>Note:</strong> Unable to load food and drink analytics
                function. Showing placeholder data instead.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="p-6 text-center">
                <h3 className="text-2xl font-bold text-secondary">
                  {placeholderData.totalCocktails}
                </h3>
                <p className="text-default-600">Total Cocktails</p>
              </Card>

              <Card className="p-6 text-center">
                <h3 className="text-2xl font-bold text-primary">
                  {placeholderData.totalMeals}
                </h3>
                <p className="text-default-600">Total Meals</p>
              </Card>

              <Card className="p-6 text-center">
                <h3 className="text-2xl font-bold text-danger">
                  {placeholderData.totalDesserts}
                </h3>
                <p className="text-default-600">Total Desserts</p>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <AnalyticsCard
                subtitle="Most popular cocktails served"
                title="Top Cocktails"
              >
                <PieChartComponent
                  colors={[
                    "#7C3AED",
                    "#8B5CF6",
                    "#A78BFA",
                    "#C4B5FD",
                    "#DDD6FE",
                  ]}
                  data={placeholderData.topCocktails}
                  height={350}
                  maxSlices={6}
                />
              </AnalyticsCard>

              <AnalyticsCard
                subtitle="Most frequent dinner choices"
                title="Popular Meals"
              >
                <BarChartComponent
                  barColor="#0EA5E9"
                  data={placeholderData.topMeals}
                  height={350}
                  maxBars={8}
                  xAxisLabel="Meals"
                  yAxisLabel="Frequency"
                />
              </AnalyticsCard>
            </div>

            <AnalyticsCard
              subtitle="Most commonly served desserts"
              title="Dessert Favorites"
            >
              <div className="h-80">
                <BarChartComponent
                  scrollable
                  barColor="#F43F5E"
                  data={placeholderData.topDesserts}
                  height={350}
                  maxBars={10}
                  xAxisLabel="Desserts"
                  yAxisLabel="Frequency"
                />
              </div>
            </AnalyticsCard>
          </>
        );
      }

      // Get the food and drink data
      let foodDrinkData = hasData
        ? getFoodDrinkAnalytics(movieData)
        : placeholderData;

      // Normalize names for display
      const normalizedCocktails = foodDrinkData.topCocktails.map((item) => ({
        name: normalizeItemName(item.name),
        value: item.value,
      }));

      const normalizedMeals = foodDrinkData.topMeals.map((item) => ({
        name: normalizeItemName(item.name),
        value: item.value,
      }));

      const normalizedDesserts = foodDrinkData.topDesserts.map((item) => ({
        name: normalizeItemName(item.name),
        value: item.value,
      }));

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
              subtitle="Most popular cocktails served"
              title="Top Cocktails"
            >
              <PieChartComponent
                colors={["#7C3AED", "#8B5CF6", "#A78BFA", "#C4B5FD", "#DDD6FE"]}
                data={normalizedCocktails}
                height={350}
                maxSlices={6}
              />
            </AnalyticsCard>

            <AnalyticsCard
              subtitle="Most frequent dinner choices"
              title="Popular Meals"
            >
              <BarChartComponent
                barColor="#0EA5E9"
                data={normalizedMeals}
                height={350}
                maxBars={8}
                xAxisLabel="Meals"
                yAxisLabel="Frequency"
              />
            </AnalyticsCard>
          </div>

          <AnalyticsCard
            subtitle="Most commonly served desserts"
            title="Dessert Favorites"
          >
            <div className="h-80">
              <BarChartComponent
                scrollable
                barColor="#F43F5E"
                data={normalizedDesserts}
                height={350}
                maxBars={10}
                xAxisLabel="Desserts"
                yAxisLabel="Frequency"
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
          classNames={{
            tabList: "gap-4",
          }}
          selectedKey={selectedKey}
          onSelectionChange={(key) => setSelectedKey(key as string)}
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
        <MovieDetailsModal
          filterType={selectedFilterType}
          filterValue={selectedFilterValue}
          isOpen={showMovieDetailsModal}
          movies={selectedMovies}
          title={modalTitle}
          onClose={() => setShowMovieDetailsModal(false)}
        />
      </div>
    </ProtectedRoute>
  );
}
