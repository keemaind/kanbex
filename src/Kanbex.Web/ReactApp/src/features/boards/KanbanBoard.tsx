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
import type { Board, TaskCard as TaskCardModel } from '../../types/index.js'
import { BoardColumn } from './BoardColumn.js'

export interface KanbanBoardProps {
  board: Board
  disabled?: boolean
  /** Read-only режим публичной доски: без drag-and-drop, добавления и открытия. */
  readOnly?: boolean
  onMoveTask: (taskId: string, targetColumnId: string) => void
  onOpenTask: (task: TaskCardModel) => void
  onCreateTask: (columnId: string) => void
}

/**
 * Канбан-доска: одна горизонтальная строка колонок равной ширины и высоты
 * с drag-and-drop между этапами. Перетаскивание — дополнение, а не замена
 * кнопкам на карточке.
 */
export function KanbanBoard({
  board,
  disabled = false,
  readOnly = false,
  onMoveTask,
  onOpenTask,
  onCreateTask,
}: KanbanBoardProps) {
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

  return (
    <div className="kb-board">
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
              readOnly={readOnly}
              onOpenTask={onOpenTask}
              onCreateTask={onCreateTask}
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
