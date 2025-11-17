
export interface Marks {
  obtained: string;
  total: string;
}

export interface CaMark extends Marks {
  id: string;
}

export interface Subject {
  id: string;
  name: string;
  credit: string;
  weights: {
    attendance: string;
    ca: string;
    midterm: string;
    endterm: string;
  };
  marks: {
    attendance: Marks;
    ca: {
      count: string;
      marks: CaMark[];
    };
    midterm: Marks;
    endterm: Marks;
  };
}

export interface SubjectResult {
  name: string;
  credit: number;
  finalPercentage: number;
  gradePoint: number;
}

export interface CalculationResult {
  sgpa: number;
  totalCredits: number;
  subjectResults: SubjectResult[];
}

// Predictor Types
export interface PredictMarks extends Marks {
  isCompleted: boolean;
}

export interface PredictCaMark extends PredictMarks {
  id: string;
}

export interface PredictSubject {
  id: string;
  name: string;
  credit: string;
  weights: {
    attendance: string;
    ca: string;
    midterm: string;
    endterm: string;
  };
  marks: {
    attendance: PredictMarks;
    ca: {
      count: string;
      marks: PredictCaMark[];
    };
    midterm: PredictMarks;
    endterm: PredictMarks;
  };
}

export interface RequiredMark {
    subjectName: string;
    componentName: string;
    marksNeeded: number;
    totalMarks: number;
}

export interface PredictionResult {
    status: 'success' | 'impossible' | 'achieved';
    message: string;
    requiredPercentage?: number;
    requiredMarks?: RequiredMark[];
}
