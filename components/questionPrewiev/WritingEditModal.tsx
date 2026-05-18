'use client';

import SummaryWritingModal from '../questionTypes/Writing';
import { Task } from '../../api/tasksApi';

interface SummaryWritingEditModalProps {
  open: boolean;
  onClose: () => void;
  exerciseId: number;
  task: Task;
  onSuccess: () => void;
}

export default function SummaryWritingEditModal(props: SummaryWritingEditModalProps) {
  return <SummaryWritingModal {...props} task={props.task} />;
}