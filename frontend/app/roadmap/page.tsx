"use client";

import Roadmap from "@/components/roadmap";
import RoadmapForm from "@/components/roadmap-form";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import TrueFocus from "@/components/TrueFocus";
import { useRouter } from "next/navigation";

const page = () => {
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [generateRoadmap, setGenerateRoadmap] = useState(false);
  const router = useRouter();
  const [formData, setFormData] = useState({
    jobRole: "",
    skills: "",
    duration: 6,
  });

  const getRoadmap = async () => {
    try {
      setLoading(true);
      setGenerateRoadmap(true);
      const res = await fetch("/api/interview/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roadmapDetails: {
            jobRole: formData.jobRole,
            skills: formData.skills,
            duration: formData.duration,
          },
        }),
      });
      const data = await res.json();
      const cleaned = data.roadmap
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      // Convert to object
      // console.log(JSON.parse(cleaned));
      setRoadmap(JSON.parse(cleaned));
      window.localStorage.setItem("roadmap", cleaned);

    } catch (error) {
      setError(error);
      setGenerateRoadmap(false);
    } finally {
      setLoading(false);
    }
  };
  const handleDownload = () => {
    const doc = new jsPDF();
    let y = 15;
    const pageHeight = doc.internal.pageSize.height;

    const addText = (text: string, indent = 0, lineHeight = 7) => {
      const lines = doc.splitTextToSize(text, 180 - indent);

      lines.forEach((line: string) => {
        if (y > pageHeight - 15) {
          doc.addPage();
          y = 15;
        }
        doc.text(line, 10 + indent, y);
        y += lineHeight;
      });
    };

    // Title
    addText(`Title: ${roadmap.title}`, 0, 10);
    y += 5;

    // 1. Overview
    addText("1. Job Role Overview:", 0, 10);
    addText(roadmap["1. Job Role Overview"], 10);
    y += 5;

    // 2. Skills Breakdown
    addText("2. Skills Breakdown:", 0, 10);
    Object.entries(roadmap["2. Skills Breakdown"]).forEach(([key, val]) => {
      addText(`• ${key}:`, 10); //@ts-ignore
      addText(val, 20); //@ts-ignore
      y += 3;
    });
    y += 5;

    // 3. Month-by-Month Roadmap
    addText("3. Month-by-Month Roadmap:", 0, 10);
    Object.entries(roadmap["3. Month-by-Month Roadmap"])?.forEach(
      ([month, section]) => {
        addText(`${month}:`, 10); //@ts-ignore

        addText("Topics:", 20); //@ts-ignore
        section?.Topics?.forEach((t) => addText(`- ${t}`, 30));

        addText("Resources:", 20); //@ts-ignore
        section?.Resources?.forEach((r) => addText(`- ${r}`, 30));

        addText("Tasks:", 20); //@ts-ignore
        section?.Tasks?.forEach((t) => addText(`- ${t}`, 30));

        y += 5;
      }
    );

    // ✅ 4. Learning Resources
    addText("4. Learning Resources:", 0, 10);

    addText("Books:", 10);
    roadmap["4. Learning Resources"]?.Books?.forEach((b: string) =>
      addText(`- ${b}`, 20)
    );

    addText("Online Courses:", 10);
    roadmap["4. Learning Resources"]?.["Online Courses"]?.forEach((c: string) =>
      addText(`- ${c}`, 20)
    );

    addText("Documentation:", 10);
    roadmap["4. Learning Resources"]?.Documentation?.forEach((d: string) =>
      addText(`- ${d}`, 20)
    );

    addText("YouTube Tutorials:", 10);
    roadmap["4. Learning Resources"]?.Youtube?.forEach((yt: string) =>
      addText(`- ${yt}`, 20)
    );

    y += 5;

    // ✅ 5. Capstone Project
    addText("5. Capstone Project:", 0, 10);
    addText(`Idea: ${roadmap["5. Capstone Project"]?.Idea}`, 10);

    addText("Features:", 10);
    roadmap["5. Capstone Project"]?.Features?.forEach((f: string) =>
      addText(`- ${f}`, 20)
    );

    addText("Technologies:", 10);
    roadmap["5. Capstone Project"]?.Tech?.forEach((t: string) =>
      addText(`- ${t}`, 20)
    );

    y += 5;

    // ✅ 6. Extra Tips
    addText("6. Extra Tips:", 0, 10);
    Object.entries(roadmap["6. Extra Tips"])?.forEach(([k, v]) => {
      addText(`${k}:`, 10);
      //@ts-ignore
      addText(v, 20);
      y += 3;
    });

    doc.save("roadmap.pdf");
  };
const handleGenerateNew = () => {
  setGenerateRoadmap(false);
  setRoadmap(null);
  setError(null);
  setFormData({
    jobRole: "",
    skills: "",
    duration: 6,
  });
};
  useEffect(()=>{
    const roadmap = window.localStorage.getItem("roadmap");
    if (roadmap) {
      setRoadmap(JSON.parse(roadmap));
      setGenerateRoadmap(true);
    }
  },[])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {!generateRoadmap ? (
        <>
          <RoadmapForm
            formData={formData}
            setFormData={setFormData}
            getRoadmap={getRoadmap}
          />
        </>
      ) : (
        <div className="mt-10">
          {generateRoadmap && loading && <div>
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
                        sentence="Generating Roadmap"
                        manualMode={false}
                        blurAmount={5}
                        borderColor="blue"
                        animationDuration={2}
                        pauseBetweenAnimations={1}
                      />
                    </div>
            </div>}
          {error && <div>Error: {error}</div>}

          {roadmap && <Roadmap data={roadmap} handleDownload={handleDownload} handleGenerateNew={handleGenerateNew} />}
        
        </div>
      )}
    </div>
  );
};

export default page;
