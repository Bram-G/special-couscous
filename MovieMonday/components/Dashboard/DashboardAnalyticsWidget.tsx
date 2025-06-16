import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Button, Spinner } from "@heroui/react";
import {
  BarChart2,
  ExternalLink,
  Film,
  Users,
  Wine,
  Drama,
  Utensils,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { PieChartComponent } from "../analytics/PieChartComponent";
import { BarChartComponent } from "../analytics/BarChartComponent";
import MovieDetailsModal from "../analytics/MovieDetailsModal";

import {
  getGenreAnalytics,
  getDirectorAnalytics,
  getActorAnalytics,
  getFoodDrinkAnalytics,
  MovieMonday,
  getMoviesByActor,
  getMoviesByDirector,
  getMoviesByGenre,
  getMoviesByCocktail,
  getMoviesByMeal,
} from "@/utils/analyticsUtils";
import { useAuth } from "@/contexts/AuthContext";

// Function to normalize item names for display - removes JSON notation
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
    { name: "Denis Villeneuve", value: 1 },
  ],
  rejectedMovies: [
    { name: "The Room", value: 3 },
    { name: "Cats", value: 2 },
    { name: "Batman & Robin", value: 2 },
    { name: "Twilight", value: 1 },
    { name: "Catwoman", value: 1 },
  ],
  cocktails: [
    { name: "Margarita", value: 5 },
    { name: "Old Fashioned", value: 4 },
    { name: "Moscow Mule", value: 3 },
    { name: "Mojito", value: 2 },
    { name: "Negroni", value: 1 },
  ],
};

const DashboardAnalyticsWidget = () => {
  const { token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [movieData, setMovieData] = useState<MovieMonday[]>([]);
  const [currentChart, setCurrentChart] = useState<
    "genres" | "directors" | "losses" | "meals" | "cocktails"
  >("genres");

  // Modal state
  const [showMovieDetailsModal, setShowMovieDetailsModal] = useState(false);
  const [selectedMovies, setSelectedMovies] = useState<any[]>([]);
  const [selectedFilterValue, setSelectedFilterValue] = useState<string>("");
  const [selectedFilterType, setSelectedFilterType] = useState<
    "actor" | "director" | "genre" | "cocktail" | "meal"
  >("genre");
  const [modalTitle, setModalTitle] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      setLoading(true);
      try {
        // Fetch movie data from API
        const response = await fetch(
          "http://localhost:8000/api/movie-monday/all",
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

  // Enhanced chart item click handler with context
  const handleChartItemClick = (
    name: string,
    type: "actor" | "director" | "genre" | "cocktail" | "meal",
    chartContext?: "winning" | "losing" | "all",
  ) => {
    if (!name || !movieData.length) return;

    let filteredMovies: any[] = [];
    let title = "";

    // Set win status based on context
    const winStatus =
      chartContext === "winning"
        ? true
        : chartContext === "losing"
          ? false
          : undefined;

    switch (type) {
      case "actor":
        filteredMovies = getMoviesByActor(movieData, name, winStatus);
        title =
          chartContext === "winning"
            ? `Winning Movies featuring ${name}`
            : chartContext === "losing"
              ? `Rejected Movies featuring ${name}`
              : `Movies featuring ${name}`;
        break;

      case "director":
        filteredMovies = getMoviesByDirector(movieData, name, winStatus);
        title =
          chartContext === "winning"
            ? `Winning Movies directed by ${name}`
            : chartContext === "losing"
              ? `Rejected Movies directed by ${name}`
              : `Movies directed by ${name}`;
        break;

      case "genre":
        filteredMovies = getMoviesByGenre(movieData, name, winStatus);
        title =
          chartContext === "winning"
            ? `Winning ${name} Movies`
            : chartContext === "losing"
              ? `Rejected ${name} Movies`
              : `${name} Movies`;
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

    setSelectedMovies(filteredMovies);
    setSelectedFilterValue(name);
    setSelectedFilterType(type);
    setModalTitle(title);
    setShowMovieDetailsModal(true);
  };

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

    if (currentChart === "genres") {
      const genreData = hasData
        ? getGenreAnalytics(movieData).genreDistribution
        : [
            { name: "Action", value: 8 },
            { name: "Comedy", value: 6 },
            { name: "Drama", value: 4 },
            { name: "Horror", value: 2 },
          ];

      return (
        <PieChartComponent
          data={genreData}
          emptyStateMessage="Watch more movies to see genre breakdown"
          height={250}
          hideLegend={true} // Show legend to display names
          maxSlices={10} // Limit to 10 slices plus "Other"
          showPercent={true} // Show percentages in the chart
          onSliceClick={(name) => handleChartItemClick(name, "genre", "all")}
        />
      );
    } else if (currentChart === "directors") {
      const directorData = hasData
        ? getDirectorAnalytics(movieData).topWinningDirectors
        : [
            { name: "Christopher Nolan", value: 3 },
            { name: "Greta Gerwig", value: 2 },
            { name: "Martin Scorsese", value: 2 },
            { name: "Steven Spielberg", value: 1 },
            { name: "Denis Villeneuve", value: 1 },
          ];

      return (
        <BarChartComponent
          barColor="#0ea5e9"
          data={directorData.slice(0, 5)}
          emptyStateMessage="More data needed to show director stats"
          height={250}
          maxBars={5}
          yAxisLabel="Movies Won" // Add Y-axis label
          onBarClick={(name) =>
            handleChartItemClick(name, "director", "winning")
          }
        />
      );
    } else if (currentChart === "meals") {
      // Get meal data and normalize the names
      let mealData;

      if (hasData && typeof getFoodDrinkAnalytics === "function") {
        mealData = getFoodDrinkAnalytics(movieData).topMeals.map((item) => ({
          name: normalizeItemName(item.name),
          value: item.value,
        }));
      } else {
        mealData = [
          { name: "Pizza", value: 4 },
          { name: "Tacos", value: 3 },
          { name: "Pasta", value: 3 },
          { name: "Burgers", value: 2 },
          { name: "Sushi", value: 2 },
        ];
      }

      return (
        <PieChartComponent
          colors={["#0EA5E9", "#38BDF8", "#7DD3FC", "#BAE6FD", "#E0F2FE"]}
          data={mealData}
          emptyStateMessage="No meal data available yet"
          height={250}
          hideLegend={true}
          maxSlices={10}
          showPercent={true}
          onSliceClick={(name) => handleChartItemClick(name, "meal")}
        />
      );
    } else if (currentChart === "cocktails") {
      // Get cocktail data and normalize the names
      let cocktailData;

      if (hasData && typeof getFoodDrinkAnalytics === "function") {
        cocktailData = getFoodDrinkAnalytics(movieData).topCocktails.map(
          (item) => ({
            name: normalizeItemName(item.name),
            value: item.value,
          }),
        );
      } else {
        cocktailData = PLACEHOLDER_DATA.cocktails;
      }

      return (
        <PieChartComponent
          colors={["#7C3AED", "#8B5CF6", "#A78BFA", "#C4B5FD", "#DDD6FE"]}
          data={cocktailData}
          emptyStateMessage="No cocktail data available yet"
          height={250}
          hideLegend={true}
          maxSlices={10}
          showPercent={true}
          onSliceClick={(name) => handleChartItemClick(name, "cocktail")}
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
            { name: "Will Smith", value: 1 },
          ];

      return (
        <BarChartComponent
          barColor="#f97316"
          data={actorLossesData.slice(0, 6)}
          emptyStateMessage="More data needed to show lost actors"
          height={250}
          maxBars={6}
          yAxisLabel="Rejections" // Add Y-axis label
          onBarClick={(name) => handleChartItemClick(name, "actor", "losing")}
        />
      );
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 className="text-primary h-5 w-5" />
          <div>
            <p className="text-lg font-semibold text-start">
              Your Movie Analytics
            </p>
            <p className="text-sm text-default-500">
              Insights from your Movie Monday sessions
            </p>
          </div>
        </div>
        <Button
          color="primary"
          endContent={<ExternalLink className="h-4 w-4" />}
          variant="light"
          onPress={() => router.push("/analytics?tab=overview")}
        >
          Full Analytics
        </Button>
      </CardHeader>

      <CardBody>
        <div className="flex gap-2 mb-4 overflow-x-none pb-2">
          <Button
            color={currentChart === "genres" ? "primary" : "default"}
            startContent={<Drama className="h-4 w-4" />}
            variant={currentChart === "genres" ? "solid" : "light"}
            onPress={() => setCurrentChart("genres")}
          >
            Genre
          </Button>
          <Button
            color={currentChart === "directors" ? "primary" : "default"}
            startContent={<Film className="h-4 w-4" />}
            variant={currentChart === "directors" ? "solid" : "light"}
            onPress={() => setCurrentChart("directors")}
          >
            Directors
          </Button>
          <Button
            color={currentChart === "losses" ? "primary" : "default"}
            startContent={<Users className="h-4 w-4" />}
            variant={currentChart === "losses" ? "solid" : "light"}
            onPress={() => setCurrentChart("losses")}
          >
            Actors
          </Button>
          <Button
            color={currentChart === "cocktails" ? "primary" : "default"}
            startContent={<Wine className="h-4 w-4" />}
            variant={currentChart === "cocktails" ? "solid" : "light"}
            onPress={() => setCurrentChart("cocktails")}
          >
            Cocktails
          </Button>
          <Button
            color={currentChart === "meals" ? "primary" : "default"}
            startContent={<Utensils className="h-4 w-4" />}
            variant={currentChart === "meals" ? "solid" : "light"}
            onPress={() => setCurrentChart("meals")}
          >
            Meals
          </Button>
        </div>

        <div className="w-full">{renderChart()}</div>
      </CardBody>

      {/* Movie Details Modal */}
      <MovieDetailsModal
        filterType={selectedFilterType}
        filterValue={selectedFilterValue}
        isOpen={showMovieDetailsModal}
        movies={selectedMovies}
        title={modalTitle}
        onClose={() => setShowMovieDetailsModal(false)}
      />
    </Card>
  );
};

export default DashboardAnalyticsWidget;
