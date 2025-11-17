import React, { useState } from 'react';
import type { Subject, Marks, CaMark, SubjectResult, CalculationResult } from '../types';
import { PlusIcon, TrashIcon, ArrowLeftIcon, SparklesIcon } from './icons';

interface SgpaCalculatorProps {
  onBack: () => void;
}

const SgpaCalculator: React.FC<SgpaCalculatorProps> = ({ onBack }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string>('');

  const addSubject = () => {
    const newSubject: Subject = {
      id: crypto.randomUUID(),
      name: '',
      credit: '',
      weights: { attendance: '0', ca: '0', midterm: '0', endterm: '0' },
      marks: {
        attendance: { obtained: '', total: '' },
        ca: { count: '1', marks: [{ id: crypto.randomUUID(), obtained: '', total: '' }] },
        midterm: { obtained: '', total: '' },
        endterm: { obtained: '', total: '' },
      },
    };
    setSubjects([...subjects, newSubject]);
    setResult(null);
  };

  const updateSubject = (id: string, updatedSubject: Subject) => {
    setSubjects(subjects.map(s => (s.id === id ? updatedSubject : s)));
  };

  const removeSubject = (id: string) => {
    setSubjects(subjects.filter(s => s.id !== id));
  };
  
  const calculateSgpa = () => {
    setError('');
    setResult(null);

    let sgpaSum = 0;
    let totalCredits = 0;
    const subjectResults: SubjectResult[] = [];

    for (const subject of subjects) {
        const credit = parseFloat(subject.credit);
        if (isNaN(credit) || credit <= 0) {
            setError(`Invalid credit for subject "${subject.name || 'Unnamed'}".`);
            return;
        }

        const wAtt = parseFloat(subject.weights.attendance) || 0;
        const wCa = parseFloat(subject.weights.ca) || 0;
        const wMid = parseFloat(subject.weights.midterm) || 0;
        const wEnd = parseFloat(subject.weights.endterm) || 0;
        
        if (Math.abs(wAtt + wCa + wMid + wEnd - 100) > 0.01) {
            setError(`Total weightage for "${subject.name || 'Unnamed'}" must be 100.`);
            return;
        }

        let finalPercentage = 0;
        
        const components = [
            { weight: wAtt, marks: [subject.marks.attendance] },
            { weight: wCa, marks: subject.marks.ca.marks },
            { weight: wMid, marks: [subject.marks.midterm] },
            { weight: wEnd, marks: [subject.marks.endterm] }
        ];

        for (const comp of components) {
            if (comp.weight > 0) {
                let compObtained = 0;
                let compTotal = 0;
                for(const mark of comp.marks) {
                    const o = parseFloat(mark.obtained);
                    const t = parseFloat(mark.total);
                    if (isNaN(o) || isNaN(t) || t < 0 || o < 0 || o > t) {
                        setError(`Invalid marks for "${subject.name || 'Unnamed'}". Obtained cannot be greater than total.`);
                        return;
                    }
                    compObtained += o;
                    compTotal += t;
                }
                if (compTotal > 0) {
                    finalPercentage += (compObtained / compTotal) * comp.weight;
                }
            }
        }
        
        const gradePoint = finalPercentage / 10;
        sgpaSum += gradePoint * credit;
        totalCredits += credit;

        subjectResults.push({
            name: subject.name || `Subject ${subjectResults.length + 1}`,
            credit,
            finalPercentage,
            gradePoint,
        });
    }

    if (totalCredits === 0) {
        setError('Total credits cannot be zero.');
        return;
    }
    
    setResult({ sgpa: sgpaSum / totalCredits, totalCredits, subjectResults });
  };


  return (
    <div className="w-full">
      <button onClick={onBack} className="flex items-center gap-2 mb-4 text-blue-400 hover:text-blue-300 transition">
        <ArrowLeftIcon /> Back to selection
      </button>
      
      {subjects.map((subject, index) => (
        <SubjectCard 
          key={subject.id} 
          subject={subject} 
          onUpdate={updateSubject} 
          onRemove={removeSubject}
          index={index}
        />
      ))}

      <button onClick={addSubject} className="w-full flex items-center justify-center gap-2 mt-4 p-3 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 hover:border-slate-500 transition">
        <PlusIcon /> Add Subject
      </button>

      {error && <div className="mt-4 p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg">{error}</div>}
      
      {subjects.length > 0 && (
         <div className="sticky bottom-0 w-full bg-slate-900/80 backdrop-blur-sm py-4 mt-6">
            <button onClick={calculateSgpa} className="w-full flex items-center justify-center gap-2 p-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-transform hover:scale-105 shadow-lg shadow-blue-600/30">
                <SparklesIcon/> Calculate SGPA
            </button>
        </div>
      )}

      {result && <ResultModal result={result} onClose={() => setResult(null)} />}
    </div>
  );
};


// Helper Components defined in the same file to avoid prop drilling and keep file count low

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label?: string, wrapperClassName?: string }>(
  ({ label, wrapperClassName, ...props }, ref) => (
  <div className={`flex flex-col ${wrapperClassName}`}>
    {label && <label className="text-sm text-slate-400 mb-1">{label}</label>}
    <input 
      ref={ref}
      className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
      {...props}
    />
  </div>
));

interface SubjectCardProps {
  subject: Subject;
  onUpdate: (id: string, subject: Subject) => void;
  onRemove: (id: string) => void;
  index: number;
}

const SubjectCard: React.FC<SubjectCardProps> = ({ subject, onUpdate, onRemove, index }) => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, path: string) => {
        const { name, value } = e.target;
        const newSubject = JSON.parse(JSON.stringify(subject));
        let current: any = newSubject;
        const keys = path.split('.');
        
        let target = current;
        for(const key of keys) {
            target = target[key];
        }
        target[name] = value;
        onUpdate(subject.id, newSubject);
    };

    const handleSimpleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdate(subject.id, { ...subject, [e.target.name]: e.target.value });
    }

    const handleCaCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const count = parseInt(e.target.value) || 1;
        const newMarks: CaMark[] = Array.from({ length: count }, (_, i) => 
            subject.marks.ca.marks[i] || { id: crypto.randomUUID(), obtained: '', total: '' }
        );
        onUpdate(subject.id, { 
            ...subject, 
            marks: { 
                ...subject.marks, 
                ca: { 
                    ...subject.marks.ca, 
                    count: e.target.value,
                    marks: newMarks
                } 
            }
        });
    };

    const handleCaMarkChange = (e: React.ChangeEvent<HTMLInputElement>, caId: string) => {
        const { name, value } = e.target;
        const newMarks = subject.marks.ca.marks.map(m => m.id === caId ? {...m, [name]: value} : m);
        onUpdate(subject.id, {
            ...subject,
            marks: {
                ...subject.marks,
                ca: {
                    ...subject.marks.ca,
                    marks: newMarks,
                }
            }
        });
    }

    // FIX: Cast 'w' to string to resolve potential 'unknown' type from Object.values, fixing TS errors.
    const totalWeight = Object.values(subject.weights).reduce((sum, w) => sum + (parseFloat(w as string) || 0), 0);
    
    return (
        <details open className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-4" >
            <summary className="font-semibold text-lg cursor-pointer flex justify-between items-center">
                <span>{subject.name || `Subject ${index + 1}`}</span>
                <button onClick={(e) => { e.preventDefault(); onRemove(subject.id);}} className="text-slate-500 hover:text-red-400 transition p-1 rounded-full">
                    <TrashIcon />
                </button>
            </summary>

            <div className="mt-4 space-y-4">
                {/* Subject Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Subject Name" name="name" value={subject.name} onChange={handleSimpleChange} placeholder="e.g., Data Structures" />
                    <Input label="Credit" name="credit" type="number" value={subject.credit} onChange={handleSimpleChange} placeholder="e.g., 4" />
                </div>

                {/* Weights */}
                <div>
                    <h4 className="font-medium mb-2 text-slate-300">Component Weights (%)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Input label="Attendance" name="attendance" type="number" value={subject.weights.attendance} onChange={(e) => handleInputChange(e, 'weights')} />
                        <Input label="CA/Project" name="ca" type="number" value={subject.weights.ca} onChange={(e) => handleInputChange(e, 'weights')} />
                        <Input label="Midterm" name="midterm" type="number" value={subject.weights.midterm} onChange={(e) => handleInputChange(e, 'weights')} />
                        <Input label="Endterm" name="endterm" type="number" value={subject.weights.endterm} onChange={(e) => handleInputChange(e, 'weights')} />
                    </div>
                    <div className={`mt-2 text-sm text-right ${totalWeight !== 100 ? 'text-yellow-400' : 'text-green-400'}`}>Total Weight: {totalWeight}%</div>
                </div>

                {/* Marks */}
                <div>
                    <h4 className="font-medium mb-2 text-slate-300">Marks Obtained</h4>
                    <div className="space-y-3">
                        {parseFloat(subject.weights.attendance) > 0 && <MarksInput label="Attendance" name="attendance" value={subject.marks.attendance} onChange={(e) => handleInputChange(e, 'marks.attendance')} />}
                        {parseFloat(subject.weights.ca) > 0 && (
                            <div>
                                <Input label="Number of CAs" name="count" type="number" min="1" value={subject.marks.ca.count} onChange={handleCaCountChange} wrapperClassName="max-w-xs mb-2"/>
                                {subject.marks.ca.marks.map((mark, i) => (
                                    <MarksInput key={mark.id} label={`CA ${i+1}`} value={mark} onChange={(e) => handleCaMarkChange(e, mark.id)} wrapperClassName="mb-2" />
                                ))}
                            </div>
                        )}
                        {parseFloat(subject.weights.midterm) > 0 && <MarksInput label="Midterm" name="midterm" value={subject.marks.midterm} onChange={(e) => handleInputChange(e, 'marks.midterm')} />}
                        {parseFloat(subject.weights.endterm) > 0 && <MarksInput label="Endterm" name="endterm" value={subject.marks.endterm} onChange={(e) => handleInputChange(e, 'marks.endterm')} />}
                    </div>
                </div>
            </div>
        </details>
    );
};

interface MarksInputProps {
    label: string;
    name?: string;
    value: Marks;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    wrapperClassName?: string;
}

const MarksInput: React.FC<MarksInputProps> = ({ label, name, value, onChange, wrapperClassName }) => (
    <div className={`flex items-end gap-2 ${wrapperClassName}`}>
        <span className="text-slate-400 w-24">{label}</span>
        <Input name="obtained" value={value.obtained} onChange={onChange} placeholder="Obtained" type="number" />
        <span className="text-slate-400 -ml-2 -mr-2">/</span>
        <Input name="total" value={value.total} onChange={onChange} placeholder="Total" type="number"/>
    </div>
);

interface ResultModalProps {
    result: CalculationResult;
    onClose: () => void;
}

const ResultModal: React.FC<ResultModalProps> = ({ result, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-6 w-full max-w-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-center text-blue-400 mb-2">Calculation Complete!</h2>
                <div className="text-center mb-6">
                    <p className="text-slate-400">Your SGPA is</p>
                    <p className="text-6xl font-bold text-white my-2">{result.sgpa.toFixed(2)}</p>
                    <p className="text-slate-500">Based on {result.totalCredits} total credits.</p>
                </div>
                
                <h3 className="font-semibold text-lg mb-3">Subject Breakdown</h3>
                <div className="max-h-60 overflow-y-auto pr-2">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 bg-slate-800">
                            <tr className="border-b border-slate-600">
                                <th className="p-2">Subject</th>
                                <th className="p-2 text-right">Credit</th>
                                <th className="p-2 text-right">Final %</th>
                                <th className="p-2 text-right">Grade Point</th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.subjectResults.map((res, i) => (
                                <tr key={i} className="border-b border-slate-700">
                                    <td className="p-2 font-medium">{res.name}</td>
                                    <td className="p-2 text-right text-slate-400">{res.credit}</td>
                                    <td className="p-2 text-right text-slate-400">{res.finalPercentage.toFixed(2)}%</td>
                                    <td className="p-2 text-right text-blue-400 font-semibold">{res.gradePoint.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                <button onClick={onClose} className="mt-6 w-full p-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition">
                    Close
                </button>
            </div>
        </div>
    );
};

export default SgpaCalculator;