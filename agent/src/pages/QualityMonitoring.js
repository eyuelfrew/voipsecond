import React, { useState, useEffect } from 'react';
import { 
  Star, TrendingUp, Award, MessageSquare, CheckCircle,
  AlertCircle, ThumbsUp, ThumbsDown, FileText, User,
  Calendar, Filter, ChevronDown, ChevronUp, Target,
  BarChart3, Activity, Clock, Phone
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { baseUrl } from '../baseUrl';
import useStore from '../store/store';

const QualityMonitoring = () => {
  const agent = useStore(state => state.agent);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');
  const [evaluations, setEvaluations] = useState([]);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [qualityScore, setQualityScore] = useState({
    overall: 0,
    communication: 0,
    problemSolving: 0,
    productKnowledge: 0,
    professionalism: 0,
    efficiency: 0
  });

  const [scoreHistory, setScoreHistory] = useState([
    { date: 'Week 1', score: 78 },
    { date: 'Week 2', score: 82 },
    { date: 'Week 3', score: 85 },
    { date: 'Week 4', score: 88 }
  ]);

  const [categoryScores, setCategoryScores] = useState([
    { category: 'Communication', score: 90, fullMark: 100 },
    { category: 'Problem Solving', score: 85, fullMark: 100 },
    { category: 'Product Knowledge', score: 88, fullMark: 100 },
    { category: 'Professionalism', score: 92, fullMark: 100 },
    { category: 'Efficiency', score: 80, fullMark: 100 }
  ]);

  useEffect(() => {
    fetchQualityData();
  }, [timeRange]);

  const fetchQualityData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/quality/agent/${agent._id || agent.id}?range=${timeRange}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setQualityScore(data.qualityScore || qualityScore);
        setEvaluations(data.evaluations || []);
      }
    } catch (error) {
      console.error('Error fetching quality data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'green';
    if (score >= 75) return 'yellow';
    if (score >= 60) return 'orange';
    return 'red';
  };

  const getScoreBadge = (score) => {
    if (score >= 90) return { label: 'Excellent', color: 'green' };
    if (score >= 75) return { label: 'Good', color: 'yellow' };
    if (score >= 60) return { label: 'Fair', color: 'orange' };
    return { label: 'Needs Improvement', color: 'red' };
  };

  const ScoreCard = ({ icon: Icon, title, score, maxScore = 100, trend }) => {
    const color = getScoreColor(score);
    const percentage = (score / maxScore) * 100;

    return (
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-yellow-500/20 hover:border-yellow-500/40 transition-all">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${color}-500/20`}>
            <Icon className={`w-6 h-6 text-${color}-400`} />
          </div>
          {trend && (
            <div className={`flex items-center space-x-1 text-${trend > 0 ? 'green' : 'red'}-400`}>
              <TrendingUp className={`w-4 h-4 ${trend < 0 ? 'rotate-180' : ''}`} />
              <span className="text-sm font-semibold">{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        
        <h3 className="text-gray-400 text-sm font-semibold mb-2">{title}</h3>
        <div className="flex items-baseline space-x-2 mb-3">
          <span className="text-4xl font-black text-white">{score}</span>
          <span className="text-gray-500 text-lg">/ {maxScore}</span>
        </div>

        {/* Progress Bar */}
        <div className="relative w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 bg-${color}-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">{percentage.toFixed(0)}% of maximum</p>
      </div>
    );
  };

  const EvaluationCard = ({ evaluation }) => {
    const [expanded, setExpanded] = useState(false);
    const badge = getScoreBadge(evaluation.overallScore);

    return (
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-all">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">{evaluation.callId || 'Call Evaluation'}</h4>
              <p className="text-gray-400 text-sm">
                {new Date(evaluation.date).toLocaleDateString()} • Evaluated by {evaluation.evaluator}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-bold bg-${badge.color}-500/20 text-${badge.color}-400 border border-${badge.color}-500/30`}>
              {evaluation.overallScore}/100
            </span>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Quick Scores */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {Object.entries(evaluation.scores || {}).map(([key, value]) => (
            <div key={key} className="text-center p-2 bg-gray-800/50 rounded-lg">
              <p className="text-xs text-gray-400 capitalize mb-1">{key}</p>
              <p className="text-lg font-bold text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-800 space-y-4">
            {/* Strengths */}
            {evaluation.strengths && evaluation.strengths.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <ThumbsUp className="w-4 h-4 text-green-400" />
                  <h5 className="text-green-400 font-semibold">Strengths</h5>
                </div>
                <ul className="space-y-1 ml-6">
                  {evaluation.strengths.map((strength, idx) => (
                    <li key={idx} className="text-gray-300 text-sm flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Areas for Improvement */}
            {evaluation.improvements && evaluation.improvements.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                  <h5 className="text-yellow-400 font-semibold">Areas for Improvement</h5>
                </div>
                <ul className="space-y-1 ml-6">
                  {evaluation.improvements.map((improvement, idx) => (
                    <li key={idx} className="text-gray-300 text-sm flex items-start">
                      <Target className="w-4 h-4 text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Supervisor Comments */}
            {evaluation.comments && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  <h5 className="text-blue-400 font-semibold">Supervisor Comments</h5>
                </div>
                <p className="text-gray-300 text-sm ml-6 p-3 bg-gray-800/50 rounded-lg">
                  {evaluation.comments}
                </p>
              </div>
            )}

            {/* Action Items */}
            {evaluation.actionItems && evaluation.actionItems.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  <h5 className="text-purple-400 font-semibold">Action Items</h5>
                </div>
                <ul className="space-y-2 ml-6">
                  {evaluation.actionItems.map((item, idx) => (
                    <li key={idx} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        readOnly
                        className="w-4 h-4 rounded border-gray-600"
                      />
                      <span className={`text-sm ${item.completed ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                        {item.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading Quality Data...</p>
        </div>
      </div>
    );
  }

  const overallBadge = getScoreBadge(qualityScore.overall);

  return (
    <div className="min-h-screen bg-black p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">Quality Monitoring</h1>
            <p className="text-gray-400">Track your call quality scores and feedback</p>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex space-x-2">
            {['week', 'month', 'quarter', 'year'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  timeRange === range
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overall Score Banner */}
      <div className={`bg-gradient-to-br from-${overallBadge.color}-500/20 to-black rounded-2xl p-8 mb-8 border-2 border-${overallBadge.color}-500/50`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className={`w-24 h-24 rounded-full bg-${overallBadge.color}-500 flex items-center justify-center`}>
              <Award className="w-12 h-12 text-black" />
            </div>
            <div>
              <h2 className="text-4xl font-black text-white mb-2">{qualityScore.overall}/100</h2>
              <p className={`text-${overallBadge.color}-400 text-xl font-bold mb-1`}>{overallBadge.label}</p>
              <p className="text-gray-400">Overall Quality Score</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 text-green-400 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-2xl font-bold">+5%</span>
            </div>
            <p className="text-gray-400">vs last period</p>
          </div>
        </div>
      </div>

      {/* Category Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <ScoreCard
          icon={MessageSquare}
          title="Communication"
          score={qualityScore.communication}
          trend={3}
        />
        <ScoreCard
          icon={Target}
          title="Problem Solving"
          score={qualityScore.problemSolving}
          trend={7}
        />
        <ScoreCard
          icon={FileText}
          title="Product Knowledge"
          score={qualityScore.productKnowledge}
          trend={-2}
        />
        <ScoreCard
          icon={Star}
          title="Professionalism"
          score={qualityScore.professionalism}
          trend={5}
        />
        <ScoreCard
          icon={Activity}
          title="Efficiency"
          score={qualityScore.efficiency}
          trend={4}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Score Trend */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-yellow-500/20">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-yellow-400" />
            Score Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={scoreHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#eab308"
                strokeWidth={3}
                dot={{ fill: '#eab308', r: 6 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-yellow-500/20">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-yellow-400" />
            Category Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={categoryScores}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="category" stroke="#9ca3af" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9ca3af" />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#eab308"
                fill="#eab308"
                fillOpacity={0.6}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Evaluations */}
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-yellow-500/20">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-yellow-400" />
          Recent Evaluations
        </h3>
        
        {evaluations.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h4 className="text-xl font-bold text-white mb-2">No Evaluations Yet</h4>
            <p className="text-gray-400">Your call evaluations will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {evaluations.map((evaluation, index) => (
              <EvaluationCard key={evaluation._id || index} evaluation={evaluation} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QualityMonitoring;
