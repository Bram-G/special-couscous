"use client";

// Drag-and-drop ranking list for ranked-choice ballots.
// Built mobile-first: drag by the grip handle (which has touch-action: none),
// so swiping anywhere else on the card still scrolls the page normally.

import React from "react";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import { GripVertical } from "lucide-react";

import { VoteCandidate } from "@/types/voting";

const posterUrl = (path: string | null) =>
  path ? `https://image.tmdb.org/t/p/w342${path}` : "/placeholder-poster.jpg";

const RANK_STYLES = [
  "bg-yellow-400 text-black", // 1st
  "bg-default-300 text-black", // 2nd
  "bg-amber-700 text-white", // 3rd
];

interface SortableRowProps {
  candidate: VoteCandidate;
  rank: number;
}

function SortableRow({ candidate, rank }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: candidate.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      className={`flex items-center gap-3 rounded-2xl border p-2 pr-1 bg-content1 select-none ${
        isDragging
          ? "border-primary shadow-xl shadow-primary/20 scale-[1.02]"
          : "border-default-200"
      }`}
      style={style}
    >
      <span
        className={`h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center text-sm font-bold ${
          RANK_STYLES[rank] || "bg-default-100 text-default-600"
        }`}
      >
        {rank + 1}
      </span>
      <img
        alt={candidate.title}
        className="w-12 h-[72px] rounded-lg object-cover flex-shrink-0"
        draggable={false}
        src={posterUrl(candidate.posterPath)}
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm leading-tight line-clamp-2">
          {candidate.title}
        </p>
        {candidate.releaseYear && (
          <p className="text-xs text-default-400">{candidate.releaseYear}</p>
        )}
      </div>
      <button
        ref={setActivatorNodeRef}
        aria-label={`Drag to reorder ${candidate.title}`}
        className={`h-12 w-11 flex-shrink-0 flex items-center justify-center rounded-xl text-default-400 ${
          isDragging ? "cursor-grabbing bg-default-100" : "cursor-grab"
        }`}
        style={{ touchAction: "none" }}
        type="button"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-6 w-6" />
      </button>
    </li>
  );
}

interface RankedBallotListProps {
  candidates: VoteCandidate[];
  /** Candidate ids, most-preferred first */
  order: number[];
  onChange: (order: number[]) => void;
}

export default function RankedBallotList({
  candidates,
  order,
  onChange,
}: RankedBallotListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const ordered = order
    .map((id) => candidates.find((c) => c.id === id))
    .filter(Boolean) as VoteCandidate[];

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(Number(active.id));
    const newIndex = order.indexOf(Number(over.id));

    if (oldIndex === -1 || newIndex === -1) return;
    onChange(arrayMove(order, oldIndex, newIndex));

    // A tiny buzz on phones that support it, so the drop feels physical
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        // ignore
      }
    }
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      sensors={sensors}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <ol className="flex flex-col gap-2 relative">
          {ordered.map((c, i) => (
            <SortableRow key={c.id} candidate={c} rank={i} />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}