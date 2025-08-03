import { CheckCircle, Circle, Clock } from "lucide-react";

interface WorkflowProgressProps {
  currentStatus: string;
  currentLocation: string;
}

const workflowSteps = [
  { id: "paper_creator", label: "Paper Creator", status: "created" },
  { id: "project_office", label: "Project Office", status: "at_project_office" },
  { id: "area_office", label: "Area Office", status: "at_area_office" },
  { id: "road_sale", label: "Road Sale Office", status: "at_road_sale" },
];

export default function WorkflowProgress({ currentStatus, currentLocation }: WorkflowProgressProps) {
  const getStepState = (stepId: string, stepStatus: string) => {
    if (currentStatus === "completed") {
      return "completed";
    }
    if (currentStatus === "rejected") {
      return stepId === currentLocation ? "rejected" : "pending";
    }
    if (stepStatus === currentStatus) {
      return "current";
    }
    
    // Check if step is completed based on workflow order
    const stepIndex = workflowSteps.findIndex(step => step.id === stepId);
    const currentIndex = workflowSteps.findIndex(step => step.status === currentStatus);
    
    if (stepIndex < currentIndex) {
      return "completed";
    }
    
    return "pending";
  };

  const getStepIcon = (state: string) => {
    switch (state) {
      case "completed":
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case "current":
        return (
          <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
            <Clock className="h-3 w-3 text-white animate-pulse" />
          </div>
        );
      case "rejected":
        return (
          <div className="h-6 w-6 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">✕</span>
          </div>
        );
      default:
        return <Circle className="h-6 w-6 text-gray-300" />;
    }
  };

  const getConnectorColor = (fromIndex: number) => {
    const fromStep = workflowSteps[fromIndex];
    const toStep = workflowSteps[fromIndex + 1];
    
    if (!toStep) return "bg-gray-300";
    
    const fromState = getStepState(fromStep.id, fromStep.status);
    const toState = getStepState(toStep.id, toStep.status);
    
    if (fromState === "completed" && (toState === "completed" || toState === "current")) {
      return "bg-blue-500";
    }
    if (fromState === "completed") {
      return "bg-green-500";
    }
    
    return "bg-gray-300";
  };

  return (
    <div className="mb-6">
      <p className="text-sm font-medium text-gray-700 mb-3">Workflow Progress</p>
      <div className="flex items-center space-x-4">
        {workflowSteps.map((step, index) => {
          const state = getStepState(step.id, step.status);
          
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                {getStepIcon(state)}
                <span 
                  className={`mt-2 text-sm ${
                    state === "current" 
                      ? "text-blue-900 font-medium" 
                      : state === "completed"
                      ? "text-green-900"
                      : state === "rejected"
                      ? "text-red-900" 
                      : "text-gray-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              
              {index < workflowSteps.length - 1 && (
                <div className={`w-8 h-0.5 mx-4 ${getConnectorColor(index)}`}></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
