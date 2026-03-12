import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ArrowLeft } from "lucide-react";

const questions = [
  {
    id: "role",
    question: "What describes you best?",
    options: ["Student", "Graduate", "Researcher", "Innovator"],
  },
  {
    id: "goal",
    question: "What do you want to do on Stusil?",
    options: ["Find project partners", "Work on school projects", "Build startup ideas", "Showcase portfolio"],
  },
  {
    id: "field",
    question: "Your main field of study?",
    options: ["Computer Science", "Engineering", "Medicine", "Business", "Arts", "Science"],
  },
  {
    id: "skill",
    question: "Your skill level",
    options: ["Beginner", "Intermediate", "Advanced"],
  },
  {
    id: "collab",
    question: "Do you want collaboration requests?",
    options: ["Yes", "No"],
  },
];

export default function GetStarted() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const handleSelect = (option: string) => {
    setAnswers({ ...answers, [questions[currentStep].id]: option });
    setTimeout(() => {
      if (currentStep < questions.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // Save to local storage to pre-fill signup if needed
        localStorage.setItem("onboarding_answers", JSON.stringify({ ...answers, [questions[currentStep].id]: option }));
        navigate("/join");
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[20%] left-[20%] w-[30%] h-[30%] rounded-full bg-primary/20 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-purple-500/20 blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
      </div>

      <div className="w-full max-w-xl">
        {currentStep > 0 && (
          <button 
            onClick={() => setCurrentStep(currentStep - 1)}
            className="mb-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        )}

        <div className="mb-8 flex items-center gap-2 justify-center">
          {questions.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? "w-8 bg-primary" : i < currentStep ? "w-4 bg-primary/50" : "w-4 bg-secondary"}`} 
            />
          ))}
        </div>

        <div className="relative h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              <h1 className="heading-tight text-3xl font-bold text-foreground mb-8 text-center">{questions[currentStep].question}</h1>
              
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {questions[currentStep].options.map((option) => {
                  const isSelected = answers[questions[currentStep].id] === option;
                  return (
                    <button
                      key={option}
                      onClick={() => handleSelect(option)}
                      className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-200 ${
                        isSelected 
                          ? "border-primary bg-primary/10 text-foreground" 
                          : "border-border/50 bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground hover:border-border"
                      }`}
                    >
                      <span className="font-medium">{option}</span>
                      {isSelected && <ChevronRight className="h-4 w-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
