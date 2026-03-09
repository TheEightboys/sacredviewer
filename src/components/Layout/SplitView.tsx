import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface SplitViewProps {
  left: ReactNode
  right: ReactNode
}

export function SplitView({ left, right }: SplitViewProps) {
  return (
    <div className="flex h-full w-full flex-col md:flex-row">
      <motion.div
        className="h-[50%] w-full bg-slate-900 md:h-full md:w-[60%]"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        {left}
      </motion.div>
      <motion.div
        className="h-[50%] w-full bg-slate-800 md:h-full md:w-[40%]"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {right}
      </motion.div>
    </div>
  )
}
