/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                hostname: 'images.unsplash.com',
            },
            {
                hostname: 'images.pexels.com',
            },
            {
                hostname: 'via.placeholder.com',
            },
            {
                hostname: 'qfqrcjpbitwfimvritmt.supabase.co',
            }
        ],
    },
    async headers() {
        return [
            {
                source: '/manifest.json',
                headers: [
                    {
                        key: 'Content-Type',
                        value: 'application/manifest+json',
                    },
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: '*'
                    }
                ],
            },
        ];
    },
};

export default nextConfig;
