"""Load testing suite"""
import asyncio
import aiohttp
import time
import statistics

class LoadTester:
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
    
    async def test_concurrent_requests(self, endpoint: str, concurrent_users: int = 50, duration: int = 30):
        """Test concurrent requests to endpoint"""
        start_time = time.time()
        tasks = []
        
        async with aiohttp.ClientSession() as session:
            while time.time() - start_time < duration:
                for _ in range(concurrent_users):
                    task = asyncio.create_task(self._make_request(session, endpoint))
                    tasks.append(task)
                
                await asyncio.sleep(1)
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            return self._analyze_results(results)
    
    async def _make_request(self, session: aiohttp.ClientSession, endpoint: str):
        """Make single HTTP request"""
        start_time = time.time()
        try:
            async with session.get(f"{self.base_url}{endpoint}") as response:
                await response.text()
                return {
                    'status': response.status,
                    'response_time': time.time() - start_time,
                    'success': response.status < 400
                }
        except Exception as e:
            return {
                'status': 0,
                'response_time': time.time() - start_time,
                'success': False,
                'error': str(e)
            }
    
    def _analyze_results(self, results):
        """Analyze load test results"""
        valid_results = [r for r in results if isinstance(r, dict)]
        
        if not valid_results:
            return {'error': 'No valid results'}
        
        response_times = [r['response_time'] for r in valid_results]
        success_count = sum(1 for r in valid_results if r['success'])
        
        return {
            'total_requests': len(valid_results),
            'successful_requests': success_count,
            'success_rate': success_count / len(valid_results) * 100,
            'avg_response_time': statistics.mean(response_times)
        }