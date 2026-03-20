import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ArrowLeft } from "lucide-react";

const questions = [
  {
    id: "role",
    question: "What describes you best?",
    options: ["Student", "Graduate", "Researcher", "Innovator"],
    type: "choice"
  },
  {
    id: "goal",
    question: "What do you want to do on Stusil?",
    options: ["Find partners", "Build startups", "Work on projects", "Showcase work"],
    type: "choice"
  },
  {
    id: "field",
    question: "Main field of study?",
    options: ["Computer Science", "Engineering", "Medicine", "Business", "Arts", "Science"],
    type: "choice"
  },
  {
    id: "university",
    question: "What's your university?",
    placeholder: "e.g. Stanford University",
    type: "text"
  },
  {
    id: "country",
    question: "Where are you based?",
    placeholder: "e.g. United States",
    type: "text"
  },
  {
    id: "dob",
    question: "When's your birthday?",
    type: "date"
  },
  {
    id: "skill",
    question: "Your skill level",
    options: ["Beginner", "Intermediate", "Advanced"],
    type: "choice"
  },
];

export default function GetStarted() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [inputValue, setInputValue] = useState("");
  const navigate = useNavigate();

  const handleNext = (val?: string) => {
    const finalVal = val || inputValue;
    if (!finalVal && (questions[currentStep].type === "text" || questions[currentStep].type === "date")) return;

    const newAnswers = { ...answers, [questions[currentStep].id]: finalVal };
    setAnswers(newAnswers);
    setInputValue("");
    
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem("onboarding_answers", JSON.stringify(newAnswers));
      navigate("/join");
    }
  };

  const currentQ = questions[currentStep];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-xl">
        {currentStep > 0 && (
          <button 
            onClick={() => setCurrentStep(currentStep - 1)}
            className="mb-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        )}

        <div className="mb-12 flex items-center gap-2 justify-center">
          {questions.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-500 ${i === currentStep ? "w-8 bg-primary" : i < currentStep ? "w-4 bg-primary/40" : "w-4 bg-secondary"}`} 
            />
          ))}
        </div>

        <div className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <h1 className="heading-tight text-4xl font-black text-foreground mb-8 text-center">{currentQ.question}</h1>
              
              {currentQ.type === "choice" ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {currentQ.options?.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleNext(option)}
                      className="flex items-center justify-between p-5 rounded-2xl border border-border/50 bg-secondary/20 text-left transition-all duration-300 hover:border-primary/50 hover:bg-primary/5 group"
                    >
                      <span className="font-bold text-sm tracking-tight">{option}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <input
                    type={currentQ.type}
                    value={inputValue}
                    autoFocus
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleNext()}
                    placeholder={currentQ.placeholder}
                    className="w-full bg-secondary/20 border border-border/50 rounded-2xl p-5 text-lg font-bold outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/30"
                  />
                  <button 
                    onClick={() => handleNext()}
                    disabled={!inputValue}
                    className="glow-button w-full shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    Continue <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
