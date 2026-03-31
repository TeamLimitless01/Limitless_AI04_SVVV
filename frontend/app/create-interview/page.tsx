"use client";
import Orb from "@/components/Orb";
import TrueFocus from "@/components/TrueFocus";
import Stepper, { Step } from "@/components/ui/stepper"; // Stepper components assumed to be available
import { strapi } from "@/lib/api/sdk";
import { number } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import React, { useState } from "react";
import toast from "react-hot-toast";

function Page() {
  const [candidateName, setCandidateName] = React.useState("");
  const [resume, setResume] = React.useState<any>(null); // File object
  const [mode, setMode] = React.useState("Technical");
  const [difficulty, setDifficulty] = React.useState("medium");
  const [skills, setSkills] = React.useState("");
  const [topic, setTopic] = React.useState("");
  const [questions, setQuestions] = React.useState("10");
  const [interviewLanguage, setInterviewLanguage] = React.useState("english");
  const router = useRouter();
  const { data } = useSession<any>();
  const [loading, setLoading] = useState(false);

  //console.log(data);

  const handleSubmitFinal = async () => {
    try {
      setLoading(true);
      if (!skills || !topic) {
        return toast.error("please provide skills and job role");
      }
      const finalData = {
        resume: resume || null,
        mode,
        difficulty,
        skills: skills.split(" ").join(","),
        topic,
        questions,
      };

      if (!candidateName) {
        return toast.error("Please provide candidate name");
      }
      if (!data || !data.user) {
        return toast.error("You must be logged in to create an interview");
      }
      if (!mode) {
        return toast.error("Please select interview mode");
      }
      if (!difficulty) {
        return toast.error("Please select interview difficulty");
      }
      if (!skills) {
        return toast.error("Please provide at least one skill");
      }
      if (!topic) {
        return toast.error("Please provide job role");
      }
      if (!questions) {
        return toast.error("Please select number of questions");
      }
      if (!interviewLanguage) {
        return toast.error("Please select interview language");
      }

      const formData = new FormData();

      formData.append("image", resume);

      const fileId = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const fileUrl = (await fileId.json()).result || null;

      const res = await strapi.create("interviews", {
        resume: fileUrl,
        mode: mode,
        difficulty: difficulty,
        skills: skills,
        details: topic,
        numberOfQuestions: parseInt(questions),
        user: data && data.user.id,
        candidateName: candidateName || "",
        interviewLanguage: interviewLanguage,
      });
      console.log("Interview Created:", res);
      toast.success("interview Created SuccessFully");
      router.push(`/interview/${res.data.documentId}`);
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const InputClasses =
    "p-3 w-full bg-white text-black rounded-lg border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out shadow-sm";
  const SelectClasses = `${InputClasses} appearance-none bg-white`;
  const LabelClasses = "block font-semibold mb-2 text-white-700 text-base";
  // Updated CardClasses to use bg-white for proper contrast and theme balance
  const CardClasses = "p-6 md:p-8 bg-transparent  rounded-xl shadow-lg mb-6";

  return (
    <>
      {loading ? (
        <div className="flex justify-center flex-col gap-8 items-center w-full h-[80vh]">
          {/* <div style={{ width: "25%", height: "150px" }}>
            <Orb
              hoverIntensity={0.5}
              rotateOnHover={true}
              hue={0}
              forceHoverState={false}
            />
          </div> */}
          <TrueFocus
            sentence="Generating Interview"
            manualMode={false}
            blurAmount={5}
            borderColor="blue"
            animationDuration={2}
            pauseBetweenAnimations={1}
          />
        </div>
      ) : (
        <>
          <div className="h-10" aria-hidden />

          <Stepper
            initialStep={1}
            onStepChange={(step) => {
              console.log(`Current step: ${step}`);
            }}
            onFinalStepCompleted={handleSubmitFinal}
            backButtonText="Back"
            nextButtonText="Continue"
          >
            {/* Step 1: Welcome */}
            <Step>
              <div className={CardClasses}>
                {/* Updated text color to indigo for visibility and theme consistency */}
                <h2 className="text-2xl font-bold text-white-700 mb-4">
                  Welcome to the Interview Stepper! 👋
                </h2>
                <p className="text-gray-500 leading-relaxed">
                  We'll guide you through setting up your personalized AI
                  interview. This process ensures the AI tailors the questions
                  to your exact needs, skills, and career focus.
                </p>
              </div>
            </Step>

            {/* Step 2: Mode, Difficulty, and Resume Upload */}
            <Step>
              <div className={CardClasses}>
                <h2 className="text-2xl font-bold text-indigo-700 mb-6">
                  Step 2: Core Setup 🛠️
                </h2>

                <div className="mb-6">
                  <label className={LabelClasses}>Candidate Name</label>
                  <input
                    type="text"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="Name of the Candidate"
                    required
                    className={InputClasses}
                  />
                </div>

                <div className="mb-6">
                  <label className={LabelClasses}>
                    Interview Language
                  </label>
                  <select
                    value={interviewLanguage}
                    onChange={(e) => setInterviewLanguage(e.target.value)}
                    required
                    className={SelectClasses}
                  >
                    <option value="english">English</option>
                    <option value="hindi">Hindi</option>
                    {/* <option value="telugu">Telugu</option>
                    <option value="tamil">Tamil</option>
                    <option value="kannada">Kannada</option>
                    <option value="malayalam">Malayalam</option> */}
                  </select>
                </div>

                <div className="mb-6">
                  <label className={LabelClasses}>
                    Upload Resume (Optional)
                  </label>
                  <input
                    type="file"
                    // Removed redundant ': any' type annotation
                    onChange={(e: any) =>
                      setResume(e.target.files ? e.target.files[0] : null)
                    }
                    accept="image/*"
                    className="w-full text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {resume && (
                    <p className="mt-2 text-sm text-green-600">
                      Selected: **{resume.name}**
                    </p>
                  )}
                </div>

                <div className="mb-6">
                  <label className={LabelClasses}>Interview Mode</label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className={SelectClasses}
                  >
                    <option value="HR">HR / Behavioral</option>
                    <option value="Technical">Technical</option>
                  </select>
                </div>

                <div className="mb-2">
                  <label className={LabelClasses}>Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className={SelectClasses}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
            </Step>

            {/* Step 3: Skills and Topic */}
            <Step>
              <div className={CardClasses}>
                <h2 className="text-2xl font-bold text-indigo-700 mb-6">
                  Step 3: Focus Area 🎯
                </h2>
                <div className="mb-6">
                  <label className={LabelClasses}>
                    Key Skills (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="e.g., React, Tailwind CSS, Next.js"
                    required
                    className={InputClasses}
                  />
                  {skills.length < 1 && (
                    <p className="text-red-600 text-sm mt-1">
                      Please add at least one skill.
                    </p>
                  )}
                </div>

                <div className="mb-2">
                  <label className={LabelClasses}>Job Role</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Frontend Web Development"
                    required
                    className={InputClasses}
                  />
                  {topic.length < 1 && (
                    <p className="text-red-600 text-sm mt-1">
                      Please provide a topic/focus.
                    </p>
                  )}
                </div>
              </div>
            </Step>

            {/* Step 4: Number of Questions */}
            <Step>
              <div className={CardClasses}>
                <h2 className="text-2xl font-bold text-indigo-700 mb-6">
                  Step 4: Interview Length ⏱️
                </h2>
                <label className={LabelClasses}>Number of Questions</label>
                <select
                  value={questions}
                  onChange={(e) => setQuestions(e.target.value)}
                  className={SelectClasses}
                >
                  <option value="3">3 Questions (Quick)</option>
                  <option value="5">5 Questions (Quick)</option>
                  <option value="10">10 Questions (Standard)</option>
                  <option value="15">15 Questions (Deep Dive)</option>
                  <option value="20">20 Questions (Comprehensive)</option>
                </select>
              </div>
            </Step>

            {/* Custom Input Check (Kept for continuity) */}
            {/* <Step>
        <div className={CardClasses}>
          <h2 className="text-2xl font-bold text-indigo-700 mb-6">
            Custom Input Check (Optional)
          </h2>
          <label className={LabelClasses}>Your Name?</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className={InputClasses}
          />
        </div>
      </Step> */}

            {/* Final Step */}
            <Step>
              <div className={CardClasses}>
                <h2 className="text-2xl font-bold text-white-700 mb-4">
                  Final Step: Ready to Practice! 🎉
                </h2>
                <p className="text-gray-300 leading-relaxed mb-5">
                  You've set up your interview profile. Review the details below
                  and click **Complete** to begin your mock interview.
                </p>
              </div>
            </Step>
          </Stepper>
        </>
      )}
    </>
  );
}

export default Page;
