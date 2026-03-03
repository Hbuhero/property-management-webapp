import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'

export default function GeneralError() {
    return (
        <div className='min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-center px-4'>
            <div className='mb-6'>
                <div className='inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-red-100 dark:bg-red-900/30 mb-4'>
                    <AlertTriangle className='h-8 w-8 text-red-600 dark:text-red-400' />
                </div>
                <h1 className='text-2xl font-bold text-slate-900 dark:text-white'>
                    Something went wrong
                </h1>
                <p className='text-slate-500 dark:text-slate-400 mt-2 max-w-sm'>
                    An unexpected error occurred while loading this page.
                </p>
            </div>
            <Link
                to='/'
                className='inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors'
            >
                Go Home
            </Link>
        </div>
    )
}
