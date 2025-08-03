"use client"

import type { MDConnection } from "@motherduck/wasm-client"

// Create a connection to MotherDuck to be used in the frontend throughout a session.
export default async function initMotherDuckConnection(mdToken: string, database?: string): Promise<MDConnection | undefined> {
    // Only run in browser environment
    if (typeof window === 'undefined') {
        console.warn("MotherDuck connection can only be initialized in browser environment")
        return
    }

    try {
        console.log('🦆 Starting MotherDuck connection initialization...')
        console.log('🔑 Token preview:', mdToken.substring(0, 20) + '...')
        console.log('🗄️ Database parameter:', database || 'undefined')

        // Check for WebAssembly support
        if (typeof WebAssembly === 'undefined') {
            throw new Error('WebAssembly is not supported in your browser. This application requires WebAssembly support to function properly.')
        }

        // Dynamically import MDConnection
        console.log('📦 Importing MotherDuck WASM client...')
        const { MDConnection } = await import("@motherduck/wasm-client")

        console.log('🔗 Creating MotherDuck connection...')
        const connection = await MDConnection.create({ mdToken })
        console.log('✅ MotherDuck connection created successfully')

        // Test basic connection with a simple query first
        console.log('🧪 Testing connection with simple query...')
        try {
            const testResult = await connection.evaluateQuery('SELECT 1 as test_connection')
            console.log('✅ Basic connection test passed:', testResult)
        } catch (testError) {
            console.error('❌ Basic connection test failed:', testError)
            throw new Error(`Connection test failed: ${testError instanceof Error ? testError.message : String(testError)}`)
        }

        // Only try to use database if it's provided and not empty
        if (database && database.trim()) {
            console.log(`🗄️ Attempting to use database: "${database}"`)
            try {
                await connection.evaluateQuery(`USE ${database}`)
                console.log(`✅ Successfully switched to database: "${database}"`)
            } catch (dbError) {
                console.error(`❌ Failed to use database "${database}":`, dbError)

                // Try to list available databases for debugging
                try {
                    console.log('🔍 Attempting to list available databases...')
                    const dbListResult = await connection.evaluateQuery('SHOW DATABASES')
                    console.log('📋 Available databases:', dbListResult)
                } catch (listError) {
                    console.error('❌ Could not list databases:', listError)
                }

                throw new Error(`Cannot access database "${database}": ${dbError instanceof Error ? dbError.message : String(dbError)}`)
            }
        } else {
            console.log('ℹ️ No database specified, using default connection')
        }

        console.log('🎉 MotherDuck connection fully initialized')
        return connection
    } catch (error) {
        console.error("💥 Failed to create MotherDuck connection:", error)
        if (error instanceof Error) {
            // Add Safari-specific messaging
            if (error.message.includes('WebAssembly')) {
                throw new Error(`Browser compatibility issue: ${error.message}. If you're using Safari, please ensure you have WebAssembly enabled in your settings.`)
            }
            throw error
        }
        throw new Error('An unexpected error occurred while initializing the database connection')
    }
}
