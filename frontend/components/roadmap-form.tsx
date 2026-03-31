"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { toast } from "sonner"

export default function RoadmapForm( {getRoadmap, formData, setFormData}: {  getRoadmap: () => void, formData: any, setFormData: (formData: any) => void} ) {
 
    const durationOptions = [
        { value: 3, label: "3 months" },
        { value: 6, label: "6 months" },
        { value: 9, label: "9 months" },
        { value: 12, label: "12 months" },
    ]

    const [isDropdownOpen, setIsDropdownOpen] = useState(false)

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            },
        },
    }

 
    const inputVariants = {
        focus: {
            scale: 1.02,
            transition: { duration: 0.2 },
        },
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (formData.jobRole.trim() === "" || formData.skills.trim() === "" || formData.duration === 0) {
            toast.error("Please fill all the fields")
                return;
        } 
        getRoadmap();
    }

    return (
        <div className=" bg-gradient-to-br  flex items-center justify-center mt-20 p-4">
            {/* Background blur effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
            </div>

            <motion.div
                className="relative z-10 w-full max-w-2xl"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header */}
                <motion.div  className="mb-12 text-center">
                    <h1 className="text-5xl font-bold text-white mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Roadmap Generator   
                    </h1>
                    <p className="text-lg text-slate-400">
                        Share your job role and skills and let&apos;s generate a roadmap for you
                    </p>
                </motion.div>

                {/* Form Card */}
                <motion.form
                    onSubmit={handleSubmit}
                    className="backdrop-blur-xl bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 shadow-2xl"
                >
                    {/* Job Role Field */}
                    <motion.div  className="mb-8">
                        <label className="block text-sm font-semibold text-slate-200 mb-3">Job Role</label>
                        <motion.input
                            type="text"
                            value={formData.jobRole}
                            onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
                            whileFocus="focus"
                            variants={inputVariants}
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                            placeholder="Enter your job role"
                            required
                        />
                    </motion.div>

                    {/* Skills Field */}
                    <motion.div  className="mb-8">
                        <label className="block text-sm font-semibold text-slate-200 mb-3">Skills</label>
                        <motion.textarea
                            value={formData.skills}
                            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                            whileFocus="focus"
                            variants={inputVariants}
                            rows={4}
                            required
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 resize-none"
                            placeholder="List your skills separated by commas"
                        />
                    </motion.div>

                    {/* Duration Dropdown */}
                    <motion.div  className="mb-8">
                        <label className="block text-sm font-semibold text-slate-200 mb-3">Duration</label>
                        <div className="relative">
                            <motion.button
                                type="button"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 flex items-center justify-between"
                                whileHover={{ backgroundColor: "rgba(51, 65, 85, 0.6)" }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <span>{durationOptions.find((opt) => opt.value === formData.duration)?.label}</span>
                                <motion.div animate={{ rotate: isDropdownOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
                                    <ChevronDown size={20} className="text-slate-400" />
                                </motion.div>
                            </motion.button>

                            {/* Dropdown Menu */}
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={isDropdownOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: -10, pointerEvents: "none" }}
                                transition={{ duration: 0.2 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-slate-700/90 border border-slate-600/50 rounded-xl overflow-hidden shadow-xl z-20 backdrop-blur"
                            >
                                {durationOptions.map((option) => (
                                    <motion.button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                            setFormData({ ...formData, duration: option.value })
                                            setIsDropdownOpen(false)
                                        }}
                                        className={`w-full px-4 py-3 text-left transition-colors duration-200 ${formData.duration === option.value
                                                ? "bg-blue-500/30 text-blue-300"
                                                : "text-slate-300 hover:bg-slate-600/50"
                                            }`}
                                        whileHover={{ paddingLeft: "1.25rem" }}
                                    >
                                        {option.label}
                                    </motion.button>
                                ))}
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Submit Button */}
                    <motion.div >
                        <motion.button
                            type="submit"
                            className="w-full cursor-pointer py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg"
                            whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)" }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Submit Profile
                        </motion.button>
                    </motion.div>
                </motion.form>
            </motion.div>
        </div>
    )
}
