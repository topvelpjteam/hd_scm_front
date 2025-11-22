import React, { useState } from 'react'
import axios from 'axios'
import { 
  Wifi, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw
} from 'lucide-react'

// API 응답 타입 정의
interface ApiResponse {
  status: string
  message: string
  timestamp?: string
  server?: string
  database?: string
  receivedData?: any
  users?: string[]
  count?: number
}

// 테스트 결과 타입 정의
interface TestResult {
  name: string
  status: 'pending' | 'success' | 'error'
  response?: ApiResponse
  error?: string
  loading: boolean
}

const ApiTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([
    { name: '서버 연결 테스트 (Ping)', status: 'pending', loading: false },
    { name: 'POST 요청 테스트 (Echo)', status: 'pending', loading: false },
    { name: '데이터베이스 연결 테스트', status: 'pending', loading: false },
    { name: '사용자 목록 조회 테스트', status: 'pending', loading: false },
    { name: '에러 처리 테스트', status: 'pending', loading: false }
  ])

  const [postData, setPostData] = useState('{"message": "Hello from Frontend!", "test": true}')

  // API 테스트 실행 함수
  const runTest = async (index: number, testFunction: () => Promise<ApiResponse>) => {
    const updatedResults = [...testResults]
    updatedResults[index] = { ...updatedResults[index], loading: true, status: 'pending' }
    setTestResults(updatedResults)

    try {
      const response = await testFunction()
      updatedResults[index] = {
        ...updatedResults[index],
        status: 'success',
        response,
        loading: false
      }
    } catch (error: any) {
      updatedResults[index] = {
        ...updatedResults[index],
        status: 'error',
        error: error.response?.data?.message || error.message,
        loading: false
      }
    }

    setTestResults(updatedResults)
  }

  // 개별 테스트 실행
  const runPingTest = () => runTest(0, () => axios.get('/api/test/ping').then(res => res.data))
  const runEchoTest = () => runTest(1, () => axios.post('/api/test/echo', JSON.parse(postData)).then(res => res.data))
  const runDatabaseTest = () => runTest(2, () => axios.get('/api/test/database').then(res => res.data))
  const runUsersTest = () => runTest(3, () => axios.get('/api/test/users').then(res => res.data))
  const runErrorTest = () => runTest(4, () => axios.get('/api/test/error').then(res => res.data))

  // 모든 테스트 실행
  const runAllTests = async () => {
    await runPingTest()
    await new Promise(resolve => setTimeout(resolve, 500)) // 0.5초 대기
    await runEchoTest()
    await new Promise(resolve => setTimeout(resolve, 500))
    await runDatabaseTest()
    await new Promise(resolve => setTimeout(resolve, 500))
    await runUsersTest()
    await new Promise(resolve => setTimeout(resolve, 500))
    await runErrorTest()
  }

  // 테스트 결과 초기화
  const resetTests = () => {
    setTestResults(testResults.map(result => ({
      ...result,
      status: 'pending',
      response: undefined,
      error: undefined,
      loading: false
    })))
  }

  // 상태에 따른 아이콘 반환
  const getStatusIcon = (result: TestResult) => {
    if (result.loading) return <RefreshCw size={16} className="animate-spin" />
    if (result.status === 'success') return <CheckCircle size={16} className="text-green-500" />
    if (result.status === 'error') return <XCircle size={16} className="text-red-500" />
    return <AlertTriangle size={16} className="text-gray-400" />
  }

  // 상태에 따른 배경색 반환
  const getStatusColor = (result: TestResult) => {
    if (result.loading) return 'bg-blue-50 border-blue-200'
    if (result.status === 'success') return 'bg-green-50 border-green-200'
    if (result.status === 'error') return 'bg-red-50 border-red-200'
    return 'bg-gray-50 border-gray-200'
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Wifi size={24} />
        API 통신 테스트
      </h2>

      {/* 테스트 컨트롤 */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">테스트 제어</h3>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={runAllTests}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
          >
            <RefreshCw size={16} />
            모든 테스트 실행
          </button>
          <button
            onClick={resetTests}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            테스트 초기화
          </button>
        </div>
      </div>

      {/* POST 데이터 입력 */}
      <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">POST 요청 데이터</h3>
        <textarea
          value={postData}
          onChange={(e) => setPostData(e.target.value)}
          className="w-full p-2 border rounded"
          rows={3}
          placeholder="JSON 형식으로 데이터를 입력하세요"
        />
                 <div className="mt-2 text-sm text-gray-600">
           유효한 JSON 형식으로 입력해주세요. 예: &#123;"message": "Hello", "test": true&#125;
         </div>
      </div>

      {/* 테스트 결과 */}
      <div className="space-y-4">
        {testResults.map((result, index) => (
          <div
            key={index}
            className={`p-4 border rounded-lg ${getStatusColor(result)}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getStatusIcon(result)}
                <span className="font-semibold">{result.name}</span>
              </div>
              <button
                onClick={() => {
                  switch (index) {
                    case 0: runPingTest(); break
                    case 1: runEchoTest(); break
                    case 2: runDatabaseTest(); break
                    case 3: runUsersTest(); break
                    case 4: runErrorTest(); break
                  }
                }}
                disabled={result.loading}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
              >
                {result.loading ? '실행 중...' : '실행'}
              </button>
            </div>

            {/* 응답 결과 표시 */}
            {result.response && (
              <div className="mt-3 p-3 bg-white rounded border">
                <h4 className="font-semibold mb-2">응답 결과:</h4>
                <pre className="text-sm bg-gray-100 p-2 rounded overflow-x-auto">
                  {JSON.stringify(result.response, null, 2)}
                </pre>
              </div>
            )}

            {/* 에러 메시지 표시 */}
            {result.error && (
              <div className="mt-3 p-3 bg-red-100 rounded border border-red-300">
                <h4 className="font-semibold mb-2 text-red-700">에러:</h4>
                <p className="text-red-600">{result.error}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 요약 정보 */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">테스트 요약</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-white rounded border">
            <div className="text-2xl font-bold text-blue-500">
              {testResults.filter(r => r.status === 'success').length}
            </div>
            <div className="text-sm text-gray-600">성공</div>
          </div>
          <div className="p-3 bg-white rounded border">
            <div className="text-2xl font-bold text-red-500">
              {testResults.filter(r => r.status === 'error').length}
            </div>
            <div className="text-sm text-gray-600">실패</div>
          </div>
          <div className="p-3 bg-white rounded border">
            <div className="text-2xl font-bold text-gray-500">
              {testResults.filter(r => r.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">대기</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApiTest
