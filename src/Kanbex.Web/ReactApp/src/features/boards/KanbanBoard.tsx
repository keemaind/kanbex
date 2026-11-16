import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { StatusBadge } from '@kanbex/ui'
import type { Board, TaskCard as TaskCardModel } from '../../types/index.js'
import { BoardColumn } from './BoardColumn.js'

export interface KanbanBoardProps {
  board: Board
  disabled?: boolean
  onMoveTask: (taskId: string, targetColumnId: string) => void
  onOpenTask: (task: TaskCardModel) => void
}

/**
 * Канбан-доска: горизонтально прокручиваемая сетка колонок с drag-and-drop
 * между этапами. Перетаскивание — дополнение, а не замена кнопкам на карточке.
 */
export function KanbanBoard({ board, disabled = false, onMoveTask, onOpenTask }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<TaskCardModel | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  )

  const orderedColumns = useMemo(() => [...board.columns].sort((a, b) => a.order - b.order), [board.columns])

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = String(event.active.id)
    const found = board.columns.flatMap((column) => column.tasks).find((task) => task.id === taskId)
    setActiveTask(found ?? null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const taskId = String(active.id)
    const targetColumnId = String(over.id)
    if (taskId && targetColumnId) onMoveTask(taskId, targetColumnId)
  }

  const totalTasks = orderedColumns.reduce((total, column) => total + column.tasks.length, 0)

  return (
    <div className="kb-board">
      <div className="kb-board__meta">
        <StatusBadge tone="info" withDot>
          {orderedColumns.length} этапа
        </StatusBadge>
        <StatusBadge tone="neutral">{totalTasks} задач всего</StatusBadge>
        <span className="kb-board__hint">
          Перетащите карточку за ручку ⠿ или используйте кнопки «Назад» / «Далее» на карточке.
        </span>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveTask(null)}
      >
        <div className="kb-board__columns">
          {orderedColumns.map((column) => (
            <BoardColumn
              key={column.id}
              column={column}
              boardColumns={orderedColumns}
              disabled={disabled}
              onOpenTask={onOpenTask}
              onMoveTask={onMoveTask}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <div className="kb-task kb-task--overlay">
              <span className="kb-task__title-static">{activeTask.title}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
