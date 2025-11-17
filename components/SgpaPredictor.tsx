
import React, { useState } from 'react';
// FIX: Import 'PredictMarks' type to resolve 'Cannot find name' errors.
import type { PredictSubject, PredictCaMark, RequiredMark, PredictionResult, PredictMarks } from '../types';
import { ArrowLeftIcon, PlusIcon, SparklesIcon, TrashIcon } from './icons';

interface SgpaPredictorProps {
    onBack: () => void;
}

const SgpaPredictor: React.FC<SgpaPredictorProps> = ({ onBack }) => {
    const [subjects, setSubjects] = useState<PredictSubject[]>([]);
    const [desiredSgpa, setDesiredSgpa] = useState('');
    const [result, setResult] = useState<PredictionResult | null>(null);
    const [error, setError] = useState<string>('');

    const addSubject = () => {
        const newSubject: PredictSubject = {
            id: crypto.randomUUID(),
            name: '',
            credit: '',
            weights: { attendance: '0', ca: '0', midterm: '0', endterm: '0' },
            marks: {
                attendance: { isCompleted: false, obtained: '', total: '' },
                ca: { count: '1', marks: [{ id: crypto.randomUUID(), isCompleted: false, obtained: '', total: '' }] },
                midterm: { isCompleted: false, obtained: '', total: '' },
                endterm: { isCompleted: false, obtained: '', total: '' },
            },
        };
        setSubjects([...subjects, newSubject]);
        setResult(null);
    };

    const updateSubject = (id: string, updatedSubject: PredictSubject) => {
        setSubjects(subjects.map(s => (s.id === id ? updatedSubject : s)));
    };

    const removeSubject = (id: string) => {
        setSubjects(subjects.filter(s => s.id !== id));
    };

    const predictSgpa = () => {
        setError('');
        setResult(null);
        
        const targetSgpa = parseFloat(desiredSgpa);
        if (isNaN(targetSgpa) || targetSgpa < 0 || targetSgpa > 10) {
            setError('Please enter a valid desired SGPA between 0 and 10.');
            return;
        }

        let currentSum = 0;
        let totalCredits = 0;
        let remainingWeightCreditSum = 0;
        const remainingComponents: { subjectName: string; componentName: string; weight: number; credit: number; totalMarks: number; }[] = [];

        for (const subject of subjects) {
            const credit = parseFloat(subject.credit);
            if (isNaN(credit) || credit <= 0) {
                setError(`Invalid credit for subject "${subject.name || 'Unnamed'}".`);
                return;
            }
            totalCredits += credit;

            const wAtt = parseFloat(subject.weights.attendance) || 0;
            const wCa = parseFloat(subject.weights.ca) || 0;
            const wMid = parseFloat(subject.weights.midterm) || 0;
            const wEnd = parseFloat(subject.weights.endterm) || 0;
            if (Math.abs(wAtt + wCa + wMid + wEnd - 100) > 0.01) {
                setError(`Total weightage for "${subject.name || 'Unnamed'}" must be 100.`);
                return;
            }

            // Attendance
            if (wAtt > 0) {
                if (subject.marks.attendance.isCompleted) {
                    const o = parseFloat(subject.marks.attendance.obtained);
                    const t = parseFloat(subject.marks.attendance.total);
                    if (isNaN(o) || isNaN(t) || t <= 0) { setError('Invalid completed marks'); return; }
                    currentSum += credit * ((o / t) * wAtt / 10);
                } else {
                    const t = parseFloat(subject.marks.attendance.total);
                    if (isNaN(t) || t <= 0) { setError('Total marks for pending components must be positive.'); return; }
                    remainingWeightCreditSum += (wAtt / 10) * credit;
                    remainingComponents.push({ subjectName: subject.name, componentName: 'Attendance', weight: wAtt, credit, totalMarks: t });
                }
            }
            
            // Midterm
             if (wMid > 0) {
                if (subject.marks.midterm.isCompleted) {
                    const o = parseFloat(subject.marks.midterm.obtained);
                    const t = parseFloat(subject.marks.midterm.total);
                    if (isNaN(o) || isNaN(t) || t <= 0) { setError('Invalid completed marks'); return; }
                    currentSum += credit * ((o / t) * wMid / 10);
                } else {
                    const t = parseFloat(subject.marks.midterm.total);
                    if (isNaN(t) || t <= 0) { setError('Total marks for pending components must be positive.'); return; }
                    remainingWeightCreditSum += (wMid / 10) * credit;
                    remainingComponents.push({ subjectName: subject.name, componentName: 'Midterm', weight: wMid, credit, totalMarks: t });
                }
            }
            
            // Endterm
            if (wEnd > 0) {
                if (subject.marks.endterm.isCompleted) {
                    const o = parseFloat(subject.marks.endterm.obtained);
                    const t = parseFloat(subject.marks.endterm.total);
                     if (isNaN(o) || isNaN(t) || t <= 0) { setError('Invalid completed marks'); return; }
                    currentSum += credit * ((o / t) * wEnd / 10);
                } else {
                    const t = parseFloat(subject.marks.endterm.total);
                    if (isNaN(t) || t <= 0) { setError('Total marks for pending components must be positive.'); return; }
                    remainingWeightCreditSum += (wEnd / 10) * credit;
                    remainingComponents.push({ subjectName: subject.name, componentName: 'Endterm', weight: wEnd, credit, totalMarks: t });
                }
            }

            // CA
            if (wCa > 0) {
                const caCount = parseInt(subject.marks.ca.count) || 1;
                const unitWeight = wCa / caCount;
                subject.marks.ca.marks.forEach((mark, i) => {
                    if (mark.isCompleted) {
                         const o = parseFloat(mark.obtained);
                         const t = parseFloat(mark.total);
                         if (isNaN(o) || isNaN(t) || t <= 0) { setError('Invalid completed marks'); return; }
                        currentSum += credit * ((o / t) * unitWeight / 10);
                    } else {
                        const t = parseFloat(mark.total);
                        if (isNaN(t) || t <= 0) { setError('Total marks for pending components must be positive.'); return; }
                        remainingWeightCreditSum += (unitWeight / 10) * credit;
                        remainingComponents.push({ subjectName: subject.name, componentName: `CA ${i + 1}`, weight: unitWeight, credit, totalMarks: t });
                    }
                });
            }
        }

        if (totalCredits === 0) {
            setError('Total credits cannot be zero.');
            return;
        }

        const sumNeeded = targetSgpa * totalCredits;
        const remainingNeeded = sumNeeded - currentSum;

        if (remainingNeeded <= 0) {
            setResult({ status: 'achieved', message: `Congratulations! You have already achieved your desired SGPA of ${targetSgpa.toFixed(2)}.` });
            return;
        }

        if (remainingComponents.length === 0) {
            setResult({ status: 'impossible', message: `Desired SGPA is not met and there are no pending components to score in.` });
            return;
        }

        const requiredFraction = remainingNeeded / remainingWeightCreditSum;
        const requiredPercentage = requiredFraction * 100;

        if (requiredFraction > 1.0) {
            setResult({ status: 'impossible', message: `It's impossible to achieve your desired SGPA. You would need to score ${requiredPercentage.toFixed(2)}% in all remaining components.` });
            return;
        }

        const requiredMarks: RequiredMark[] = remainingComponents.map(comp => ({
            ...comp,
            marksNeeded: comp.totalMarks * requiredFraction,
        }));
        
        setResult({
            status: 'success',
            message: `To achieve an SGPA of ${targetSgpa.toFixed(2)}, you need to score:`,
            requiredPercentage,
            requiredMarks,
        });
    };


    return (
        <div className="w-full">
            <button onClick={onBack} className="flex items-center gap-2 mb-4 text-blue-400 hover:text-blue-300 transition">
                <ArrowLeftIcon /> Back to selection
            </button>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-4">
                <Input label="Desired SGPA (0.0 - 10.0)" type="number" value={desiredSgpa} onChange={(e) => setDesiredSgpa(e.target.value)} placeholder="e.g., 8.5" />
            </div>

            {subjects.map((subject, index) => (
                <PredictSubjectCard key={subject.id} subject={subject} onUpdate={updateSubject} onRemove={removeSubject} index={index} />
            ))}
            
            <button onClick={addSubject} className="w-full flex items-center justify-center gap-2 mt-4 p-3 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 hover:border-slate-500 transition">
                <PlusIcon /> Add Subject
            </button>

            {error && <div className="mt-4 p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg">{error}</div>}

            {subjects.length > 0 && (
                <div className="sticky bottom-0 w-full bg-slate-900/80 backdrop-blur-sm py-4 mt-6">
                    <button onClick={predictSgpa} className="w-full flex items-center justify-center gap-2 p-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-transform hover:scale-105 shadow-lg shadow-blue-600/30">
                        <SparklesIcon /> Predict Required Marks
                    </button>
                </div>
            )}
            
            {result && <PredictResultModal result={result} onClose={() => setResult(null)} />}
        </div>
    );
};

// Reusable component defined locally
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

interface PredictSubjectCardProps {
  subject: PredictSubject;
  onUpdate: (id: string, subject: PredictSubject) => void;
  onRemove: (id: string) => void;
  index: number;
}

const PredictSubjectCard: React.FC<PredictSubjectCardProps> = ({ subject, onUpdate, onRemove, index }) => {
    // This is a simplified handler. A more robust solution would handle nested state more gracefully.
    const handleChange = (path: string, value: any) => {
        const keys = path.split('.');
        let newSubject = JSON.parse(JSON.stringify(subject)); // Deep copy
        let current = newSubject;
        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        onUpdate(subject.id, newSubject);
    };

    const handleCaCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const count = parseInt(e.target.value) || 1;
        const newMarks: PredictCaMark[] = Array.from({ length: count }, (_, i) => 
            subject.marks.ca.marks[i] || { id: crypto.randomUUID(), isCompleted: false, obtained: '', total: '' }
        );
        handleChange('marks.ca', { count: e.target.value, marks: newMarks });
    };
    
    // FIX: Cast 'w' to string to resolve potential 'unknown' type from Object.values, fixing TS errors.
    const totalWeight = Object.values(subject.weights).reduce((sum, w) => sum + (parseFloat(w as string) || 0), 0);

    return (
        <details open className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-4">
            <summary className="font-semibold text-lg cursor-pointer flex justify-between items-center">
                <span>{subject.name || `Subject ${index + 1}`}</span>
                <button onClick={(e) => { e.preventDefault(); onRemove(subject.id);}} className="text-slate-500 hover:text-red-400 transition p-1 rounded-full">
                    <TrashIcon />
                </button>
            </summary>
            <div className="mt-4 space-y-4">
                {/* Subject Details & Weights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Subject Name" value={subject.name} onChange={(e) => handleChange('name', e.target.value)} />
                    <Input label="Credit" type="number" value={subject.credit} onChange={(e) => handleChange('credit', e.target.value)} />
                </div>
                <div>
                     <h4 className="font-medium mb-2 text-slate-300">Component Weights (%)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Input label="Attendance" type="number" value={subject.weights.attendance} onChange={(e) => handleChange('weights.attendance', e.target.value)} />
                        <Input label="CA/Project" type="number" value={subject.weights.ca} onChange={(e) => handleChange('weights.ca', e.target.value)} />
                        <Input label="Midterm" type="number" value={subject.weights.midterm} onChange={(e) => handleChange('weights.midterm', e.target.value)} />
                        <Input label="Endterm" type="number" value={subject.weights.endterm} onChange={(e) => handleChange('weights.endterm', e.target.value)} />
                    </div>
                     <div className={`mt-2 text-sm text-right ${totalWeight !== 100 ? 'text-yellow-400' : 'text-green-400'}`}>Total Weight: {totalWeight}%</div>
                </div>

                {/* Marks */}
                <div>
                    <h4 className="font-medium mb-2 text-slate-300">Marks Status</h4>
                    <div className="space-y-3">
                        {parseFloat(subject.weights.attendance) > 0 && <PredictMarksInput label="Attendance" value={subject.marks.attendance} onChange={(val) => handleChange('marks.attendance', val)} />}
                        {parseFloat(subject.weights.ca) > 0 && (
                            <div>
                                <Input label="Number of CAs" name="count" type="number" min="1" value={subject.marks.ca.count} onChange={handleCaCountChange} wrapperClassName="max-w-xs mb-2"/>
                                {subject.marks.ca.marks.map((mark, i) => (
                                    <PredictMarksInput key={mark.id} label={`CA ${i+1}`} value={mark} onChange={(val) => handleChange(`marks.ca.marks.${i}`, val)} wrapperClassName="mb-2"/>
                                ))}
                            </div>
                        )}
                        {parseFloat(subject.weights.midterm) > 0 && <PredictMarksInput label="Midterm" value={subject.marks.midterm} onChange={(val) => handleChange('marks.midterm', val)} />}
                        {parseFloat(subject.weights.endterm) > 0 && <PredictMarksInput label="Endterm" value={subject.marks.endterm} onChange={(val) => handleChange('marks.endterm', val)} />}
                    </div>
                </div>
            </div>
        </details>
    );
};

interface PredictMarksInputProps {
    label: string;
    value: PredictMarks;
    onChange: (value: PredictMarks) => void;
    wrapperClassName?: string;
}

const PredictMarksInput: React.FC<PredictMarksInputProps> = ({ label, value, onChange, wrapperClassName }) => {
    return (
         <div className={`grid grid-cols-1 md:grid-cols-3 gap-2 items-center p-2 rounded-md ${value.isCompleted ? 'bg-slate-700/50' : ''} ${wrapperClassName}`}>
            <label className="flex items-center gap-2 cursor-pointer col-span-1">
                <input type="checkbox" checked={value.isCompleted} onChange={(e) => onChange({...value, isCompleted: e.target.checked})} className="form-checkbox h-5 w-5 rounded bg-slate-600 border-slate-500 text-blue-500 focus:ring-blue-500"/>
                <span className="text-slate-400">{label}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${value.isCompleted ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                    {value.isCompleted ? 'Done' : 'Pending'}
                </span>
            </label>
            <div className="flex items-end gap-2 col-span-2">
                {value.isCompleted ? (
                    <>
                        <Input name="obtained" value={value.obtained} onChange={(e) => onChange({...value, obtained: e.target.value})} placeholder="Obtained" type="number" />
                        <span className="text-slate-400 -ml-2 -mr-2">/</span>
                    </>
                ) : null}
                <Input name="total" value={value.total} onChange={(e) => onChange({...value, total: e.target.value})} placeholder="Total Marks" type="number" />
            </div>
        </div>
    );
};


interface PredictResultModalProps {
    result: PredictionResult;
    onClose: () => void;
}

const PredictResultModal: React.FC<PredictResultModalProps> = ({ result, onClose }) => {
    const colorClasses = {
        success: 'text-blue-400',
        achieved: 'text-green-400',
        impossible: 'text-red-400',
    };
    
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-6 w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <h2 className={`text-2xl font-bold text-center mb-4 ${colorClasses[result.status]}`}>Prediction Result</h2>
                <p className="text-center text-slate-300 mb-6">{result.message}</p>
                
                {result.status === 'success' && result.requiredPercentage !== undefined && (
                    <div className="text-center mb-6">
                        <p className="text-slate-400">Average score required in all pending components:</p>
                        <p className="text-4xl font-bold text-white my-2">{result.requiredPercentage.toFixed(2)}%</p>
                    </div>
                )}
                
                {result.status === 'success' && result.requiredMarks && (
                    <>
                        <h3 className="font-semibold text-lg mb-3">Marks Required</h3>
                        <div className="max-h-60 overflow-y-auto pr-2">
                             <table className="w-full text-left">
                                <thead className="sticky top-0 bg-slate-800">
                                    <tr className="border-b border-slate-600">
                                        <th className="p-2">Subject</th>
                                        <th className="p-2">Component</th>
                                        <th className="p-2 text-right">Marks Needed</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.requiredMarks.map((res, i) => (
                                        <tr key={i} className="border-b border-slate-700">
                                            <td className="p-2 font-medium">{res.subjectName}</td>
                                            <td className="p-2 text-slate-400">{res.componentName}</td>
                                            <td className="p-2 text-right text-blue-400 font-semibold">{res.marksNeeded.toFixed(2)} / {res.totalMarks}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
                
                <button onClick={onClose} className="mt-6 w-full p-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition">
                    Close
                </button>
            </div>
        </div>
    );
}

export default SgpaPredictor;