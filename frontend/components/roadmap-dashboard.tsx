 "use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import SkillsOverview from "./skills-overview"
import MonthCard from "./month-card"
import ResourcesSection from "./resources-section"
import CapstoneSection from "./capstone-section"
import { Button } from "./ui/button"
import { useRouter } from "next/navigation"

interface RoadmapData {
  [key: string]: any
}

export default function RoadmapDashboard({ data, handleDownload, handleGenerateNew }: { data: RoadmapData, handleDownload: () => void, handleGenerateNew: () => void }) {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(1)

  const monthRoadmap = data["3. Month-by-Month Roadmap"] || {}
  const totalMonths = Object.keys(monthRoadmap).length

  const getCurrentMonthData = () => {
    const monthKey = `Month ${selectedMonth}`
    return monthRoadmap[monthKey]
  }

  const handlePrevMonth = () => {
    setSelectedMonth((prev) => (prev === 1 ? totalMonths : prev - 1))
  }

  const handleNextMonth = () => {
    setSelectedMonth((prev) => (prev === totalMonths ? 1 : prev + 1))
  }

  return (
    <div className="min-h-screen min-w-0 bg-transparent p-3 sm:p-5 md:p-8">
      <div className="mx-auto w-full max-w-6xl min-w-0">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
         <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
           <h1 className="mb-0 min-w-0 break-words text-3xl font-bold text-balance sm:text-4xl md:text-5xl">{data["title"]}</h1>
           <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
                 <Button className="w-full cursor-pointer sm:w-auto" onClick={handleDownload}>
                Download
              </Button>
              <Button className="w-full cursor-pointer sm:w-auto" onClick={()=>router.push("/chat")}>
                Chat
              </Button>
                  <Button className="w-full cursor-pointer sm:w-auto" onClick={()=>{
               handleGenerateNew()}}>
                Generate New
              </Button>
           </div>
         </div>
          <p className="mt-4 break-words text-base text-muted-foreground sm:text-lg">{data["1. Job Role Overview"]}</p>
        </div>

        {/* Skills Overview */}
        <SkillsOverview skills={data["2. Skills Breakdown"]} />

        {/* Month Navigation and Display */}
        <div className="my-8 sm:my-12">
          <div className="mb-5 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold sm:text-3xl">Month-by-Month Learning Path</h2>
            <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-lg bg-card border border-border hover:bg-muted transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-semibold bg-primary text-gray-700 px-4 py-2 rounded-lg min-w-fit">
                Month {selectedMonth} of {totalMonths}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-lg bg-card border border-border hover:bg-muted transition-colors"
                aria-label="Next month"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Month Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {Array.from({ length: totalMonths }, (_, i) => {
              const monthNum = i + 1
              const monthData = monthRoadmap[`Month ${monthNum}`]
              return (
                <button
                  key={monthNum}
                  onClick={() => setSelectedMonth(monthNum)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedMonth === monthNum
                      ? "border-primary bg-primary text-gray-700 bg-opacity-10"
                      : "border-border text-gray-200 bg-card hover:border-primary hover:border-opacity-50"
                  }`}
                >
                  <div className="font-semibold  mb-2">Month {monthNum}</div>
                  <div className="text-sm">{monthData.Topics?.[0]}</div>
                </button>
              )
            })}
          </div>

          {/* Selected Month Detail */}
          <MonthCard month={selectedMonth} data={getCurrentMonthData()} />
        </div>

        {/* Resources Section */}
        <ResourcesSection resources={data["4. Learning Resources"]} />

        {/* Capstone Project */}
        <CapstoneSection capstone={data["5. Capstone Project"]} />

        {/* Extra Tips */}
        <div className="mt-12 bg-card border border-border rounded-lg p-8">
          <h3 className="text-2xl font-bold mb-6">Pro Tips for Success</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(data["6. Extra Tips"] || {}).map(([key, value]:any) => (
              <div key={key} className="flex flex-col gap-3">
                <h4 className="font-semibold text-accent text-lg">{key}</h4>
               <p className="text-muted-foreground text-sm leading-relaxed">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
