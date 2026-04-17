// Алгоритм симуляции агентного моделирования
// Основан на статье Андреюк, Кругликов, Сагайдако (2023)

// Генерация случайного вектора заданной размерности
function generateRandomVector(dimension) {
  const vector = [];
  for (let i = 0; i < dimension; i++) {
    vector.push(Math.random() * 2 - 1); // значения от -1 до 1
  }
  return vector;
}

// Нормализация вектора
function normalizeVector(vector) {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return magnitude === 0 ? vector : vector.map(val => val / magnitude);
}

// Косинусная близость между двумя векторами
export function cosineSimilarity(vec1, vec2) {
  const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
  const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
  
  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  return dotProduct / (magnitude1 * magnitude2);
}

// Генерация популяции агентов
export function generateAgentPopulation(N = 150, dimension, numClusters = 3, initialAgentVectors = null) {
  const agents = [];
  let finalN = N;
  let finalDimension = dimension;

  if (initialAgentVectors) {
    finalN = initialAgentVectors.length;
    if (finalN === 0) throw new Error("Загруженный файл агентов пуст.");
    finalDimension = initialAgentVectors[0].length;
  }

  // Создаем центры кластеров
  let clusterCenters = [];
  
  if (initialAgentVectors && initialAgentVectors.length >= numClusters) {
    // Для загруженных данных используем K-means подход
    // Выбираем первые агентов как начальные центры кластеров
    for (let i = 0; i < numClusters; i++) {
      const centerIndex = Math.floor((i * finalN) / numClusters);
      clusterCenters.push(normalizeVector([...initialAgentVectors[centerIndex]]));
    }
    
    // Улучшаем центры кластеров итеративно
    for (let iter = 0; iter < 5; iter++) {
      const clusters = Array(numClusters).fill().map(() => []);
      
      // Назначаем агентов к кластерам
      for (let i = 0; i < finalN; i++) {
        const agentVector = normalizeVector(initialAgentVectors[i]);
        let bestCluster = 0;
        let maxSimilarity = -1;
        
        for (let c = 0; c < numClusters; c++) {
          const similarity = cosineSimilarity(agentVector, clusterCenters[c]);
          if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
            bestCluster = c;
          }
        }
        clusters[bestCluster].push(agentVector);
      }
      
      // Пересчитываем центры кластеров
      for (let c = 0; c < numClusters; c++) {
        if (clusters[c].length > 0) {
          const newCenter = Array(finalDimension).fill(0);
          for (const agent of clusters[c]) {
            for (let j = 0; j < finalDimension; j++) {
              newCenter[j] += agent[j];
            }
          }
          for (let j = 0; j < finalDimension; j++) {
            newCenter[j] /= clusters[c].length;
          }
          clusterCenters[c] = normalizeVector(newCenter);
        }
      }
    }
  } else {
    // Для сгенерированных данных используем старый алгоритм
    for (let i = 0; i < numClusters; i++) {
      const center = [];
      for (let j = 0; j < finalDimension; j++) {
        const baseValue = (i / (numClusters - 1)) * 2 - 1; // от -1 до 1
        const variation = (Math.random() - 0.5) * 1.5; // больше вариации
        center.push(baseValue + variation);
      }
      clusterCenters.push(normalizeVector(center));
    }
  }

  // Генерируем агентов или используем загруженные
  for (let i = 0; i < finalN; i++) {
    let agentValues;
    if (initialAgentVectors) {
      agentValues = initialAgentVectors[i];
    } else {
      const clusterId = i % numClusters;
      const center = clusterCenters[clusterId];
      
      // Увеличиваем разнообразие внутри кластеров
      const noiseLevel = 0.4 + (clusterId / numClusters) * 0.3; // от 0.4 до 0.7
      agentValues = center.map(val => {
        const noise = (Math.random() - 0.5) * noiseLevel;
        return val + noise;
      });
    }

    // Определяем кластер для агента
    let agentCluster = 0;
    let maxSimilarity = -1;
    
    for (let c = 0; c < numClusters; c++) {
      const similarity = cosineSimilarity(normalizeVector(agentValues), clusterCenters[c]);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        agentCluster = c;
      }
    }
    
    // Для загруженных данных добавляем принудительное распределение
    if (initialAgentVectors && numClusters > 1) {
      // Принудительно распределяем агентов по кластерам для разнообразия
      const forcedCluster = i % numClusters;
      if (maxSimilarity < 0.7) { // Если сходство не очень высокое
        agentCluster = forcedCluster;
      }
    }

    agents.push({
      id: i,
      values: normalizeVector(agentValues),
      cluster: agentCluster,
      opinions: {} // мнения по темам будут добавляться динамически
    });
  }

  return { agents, clusterCenters };
}

// Генерация тем информационной повестки
export function generateTopics(dimension, scenario, clusterCenters = [], initialTopicVectors = null, customScenario = null, numClusters, recalculateClustersAfter, agents) {
  const topics = [];

  // Если есть пользовательский сценарий
  if (customScenario && customScenario.customLogic) {
    // Security: `customLogic` is executed via `new Function(...)`, which is
    // equivalent to eval. It MUST only come from code the user typed into the
    // editor themselves — never from an imported/untrusted scenario JSON.
    // `EnhancedScenarioManager.importScenario` strips this field on import;
    // keep the warning here as defence-in-depth in case another caller adds
    // a new import path in the future.
    if (typeof customScenario.customLogic !== 'string') {
      console.warn('Ignoring non-string customLogic in customScenario');
    } else try {
      // Выполняем пользовательский код
      const customFunction = new Function('agents', 'clusterCenters', 'vectorDimension', 'numClusters', 'recalculateClustersAfter', customScenario.customLogic);
      const customTopics = customFunction(agents, clusterCenters, dimension, numClusters, recalculateClustersAfter);
      
      if (Array.isArray(customTopics)) {
        return customTopics.map((topic, index) => ({
          id: index,
          vector: Array.isArray(topic) ? normalizeVector(topic) : normalizeVector(topic.vector || generateRandomVector(dimension))
        }));
      }
    } catch (error) {
      console.error('Ошибка в пользовательском сценарии:', error);
      // Fallback к стандартному сценарию A
    }
  }

  if (initialTopicVectors) {
    initialTopicVectors.forEach((vec, index) => {
      topics.push({
        id: index,
        vector: normalizeVector(vec)
      });
    });
  } else {
    // Генерируем 10 разнообразных тем
    for (let i = 0; i < 10; i++) {
      // Создаем более разнообразные темы
      const topicVector = [];
      for (let j = 0; j < dimension; j++) {
        // Используем различные распределения для создания разнообразия
        const baseValue = Math.sin(i * Math.PI / 5) * Math.cos(j * Math.PI / dimension);
        const randomComponent = (Math.random() - 0.5) * 2;
        topicVector.push(baseValue + randomComponent);
      }
      
      topics.push({
        id: i,
        vector: normalizeVector(topicVector)
      });
    }

    // В сценарии B одна тема близка к одному из кластеров
    if (scenario === 'B' && clusterCenters.length > 0) {
      const targetCluster = Math.floor(Math.random() * clusterCenters.length);
      const targetCenter = clusterCenters[targetCluster];

      // Создаем тему очень близкую к центру кластера (почти идентичную)
      const closeVector = targetCenter.map(val => val + (Math.random() - 0.5) * 0.05); // очень малый шум

      topics[0] = {
        id: 0,
        vector: normalizeVector(closeVector),
        isTargetTopic: true,
        targetCluster
      };

      // Добавляем еще одну близкую тему для усиления эффекта
      const closeVector2 = targetCenter.map(val => val + (Math.random() - 0.5) * 0.08);
      topics[1] = {
        id: 1,
        vector: normalizeVector(closeVector2),
        isTargetTopic: true,
        targetCluster
      };
    }
  }

  return topics;
}

// Вычисление силы связи между агентами
function calculateConnectionStrength(agent1, agent2, topics, alpha = 0.4, beta = 0.3, gamma = 0.1) {
  // Сходство ценностей
  const valueSimilarity = Math.max(0, cosineSimilarity(agent1.values, agent2.values));
  
  // Тематическое выравнивание (средняя близость к темам)
  let topicalAlignment = 0;
  topics.forEach(topic => {
    const alignment1 = Math.max(0, cosineSimilarity(agent1.values, topic.vector));
    const alignment2 = Math.max(0, cosineSimilarity(agent2.values, topic.vector));
    topicalAlignment += Math.min(alignment1, alignment2);
  });
  topicalAlignment /= topics.length;
  
  // Вероятность общения
  const probability = alpha * valueSimilarity + beta * topicalAlignment + gamma;
  return Math.max(0, Math.min(1, probability));
}

// Выбор темы для общения
function selectTopicForCommunication(agent1, agent2, topics) {
  const topicWeights = topics.map(topic => {
    const alignment1 = Math.max(0, cosineSimilarity(agent1.values, topic.vector));
    const alignment2 = Math.max(0, cosineSimilarity(agent2.values, topic.vector));
    return (alignment1 + alignment2) / 2;
  });
  
  // Выбираем тему пропорционально весам
  const totalWeight = topicWeights.reduce((sum, weight) => sum + weight, 0);
  if (totalWeight === 0) return topics[0];
  
  let random = Math.random() * totalWeight;
  for (let i = 0; i < topics.length; i++) {
    random -= topicWeights[i];
    if (random <= 0) return topics[i];
  }
  
  return topics[topics.length - 1];
}

// Основная симуляция
export function runSimulation(agents, topics, cycles = 20, threshold = 0.3, recalculateClustersAfter = 0) {
  const N = agents.length;
  const connections = Array(N).fill().map(() => Array(N).fill(0));
  
  // Инициализируем слабые связи с небольшой вариацией
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      connections[i][j] = connections[j][i] = 0.1 + Math.random() * 0.2; // от 0.1 до 0.3
    }
  }
  
  // Запускаем симуляцию
  for (let cycle = 0; cycle < cycles; cycle++) {
    // Пересчет кластеров, если необходимо


    // Случайные пары агентов пытаются общаться
    const numInteractions = Math.floor(N * 2); // количество попыток общения за цикл
    
    for (let interaction = 0; interaction < numInteractions; interaction++) {
      const i = Math.floor(Math.random() * N);
      const j = Math.floor(Math.random() * N);
      
      if (i === j) continue;
      
      const agent1 = agents[i];
      const agent2 = agents[j];
      const currentConnection = connections[i][j];
      
      // Вероятность общения зависит от потенциальной совместимости и текущей связи
      const baseProbability = calculateConnectionStrength(agent1, agent2, topics);
      const connectionBonus = currentConnection * 0.5; // бонус от существующей связи
      const finalProbability = Math.min(0.8, baseProbability * 0.3 + connectionBonus + 0.2);
      
      if (Math.random() < finalProbability) {
        // Общение происходит
        const topic = selectTopicForCommunication(agent1, agent2, topics);
        
        // Вычисляем мнения агентов по выбранной теме с улучшенным алгоритмом
        let opinion1 = cosineSimilarity(agent1.values, topic.vector);
        let opinion2 = cosineSimilarity(agent2.values, topic.vector);
        
        // Добавляем небольшую случайность для предотвращения концентрации в крайних значениях
        const randomFactor1 = (Math.random() - 0.5) * 0.2; // ±0.1
        const randomFactor2 = (Math.random() - 0.5) * 0.2; // ±0.1
        
        opinion1 = Math.max(-1, Math.min(1, opinion1 + randomFactor1));
        opinion2 = Math.max(-1, Math.min(1, opinion2 + randomFactor2));
        
        const opinionDifference = Math.abs(opinion1 - opinion2);
        
        // Корректируем связь
        if (opinionDifference < threshold) {
          // Мнения близки - связь усиливается
          const strengthIncrease = 0.15 + Math.random() * 0.1; // от 0.15 до 0.25
          connections[i][j] = connections[j][i] = Math.min(1, currentConnection + strengthIncrease);
        } else {
          // Мнения различаются - связь ослабляется
          const strengthDecrease = 0.08 + Math.random() * 0.05; // от 0.08 до 0.13
          connections[i][j] = connections[j][i] = Math.max(0, currentConnection - strengthDecrease);
        }
      }
    }
  }
  
  return { connections, agents };
}



// Подготовка данных для визуализации
export function prepareVisualizationData(agents, connections, threshold = 0.5) {
  const nodes = agents.map(agent => {
    // Подсчитываем количество значимых связей
    const degree = connections[agent.id].filter(strength => strength >= threshold).length;
    
    return {
      id: agent.id,
      cluster: agent.cluster,
      degree: degree,
      values: agent.values
    };
  });
  
  const links = [];
  for (let i = 0; i < agents.length; i++) {
    for (let j = i + 1; j < agents.length; j++) {
      const strength = connections[i][j];
      if (strength >= threshold) {
        links.push({
          source: i,
          target: j,
          strength: strength
        });
      }
    }
  }
  
  return { nodes, links };
}



// Генерация подробного текстового отчета о результатах симуляции
export function generateSimulationReport(agents, connections, topics, scenario, cycles, threshold) {
  const { nodes, links } = prepareVisualizationData(agents, connections, threshold);
  
  // Анализ общей структуры сети
  const totalAgents = agents.length;
  const totalConnections = links.length;
  const connectionDensity = (totalConnections / (totalAgents * (totalAgents - 1) / 2) * 100).toFixed(1);
  
  // Анализ по кластерам
  const clusterStats = {};
  const maxCluster = Math.max(...nodes.map(node => node.cluster));
  for (let i = 0; i <= maxCluster; i++) {
    const clusterAgents = nodes.filter(node => node.cluster === i);
    const clusterConnections = links.filter(link => 
      nodes[link.source].cluster === i && nodes[link.target].cluster === i
    );
    const crossClusterConnections = links.filter(link => 
      (nodes[link.source].cluster === i && nodes[link.target].cluster !== i) ||
      (nodes[link.target].cluster === i && nodes[link.source].cluster !== i)
    );
    
    clusterStats[i] = {
      agentCount: clusterAgents.length,
      internalConnections: clusterConnections.length,
      externalConnections: crossClusterConnections.length,
      avgDegree: clusterAgents.reduce((sum, agent) => sum + agent.degree, 0) / clusterAgents.length || 0
    };
  }
  
  // Поиск самых влиятельных агентов
  const topAgents = nodes
    .sort((a, b) => b.degree - a.degree)
    .slice(0, 5);
  
  // Анализ силы связей
  const connectionStrengths = links.map(link => link.strength);
  const avgStrength = connectionStrengths.reduce((sum, str) => sum + str, 0) / connectionStrengths.length || 0;
  const strongConnections = links.filter(link => link.strength > 0.7).length;
  const weakConnections = links.filter(link => link.strength < 0.4).length;
  
  // Анализ межкластерных связей
  const interClusterConnections = links.filter(link => 
    nodes[link.source].cluster !== nodes[link.target].cluster
  ).length;
  const intraClusterConnections = totalConnections - interClusterConnections;
  
  // Формирование отчета
  let report = `## Анализ результатов симуляции\n\n`;
  
  report += `### Общие характеристики сети\n\n`;
  report += `**Сценарий:** ${scenario === 'A' ? 'Нейтральная информационная повестка' : 'Ценностно-близкая тема в повестке'}\n`;
  report += `**Количество циклов симуляции:** ${cycles}\n`;
  report += `**Общее количество агентов:** ${totalAgents}\n`;
  report += `**Сформировавшихся связей:** ${totalConnections} (порог отображения: ${threshold})\n`;
  report += `**Плотность сети:** ${connectionDensity}% от максимально возможной\n`;
  report += `**Средняя сила связи:** ${avgStrength.toFixed(3)}\n\n`;
  
  report += `### Распределение связей по силе\n\n`;
  report += `- **Сильные связи** (>0.7): ${strongConnections} (${(strongConnections/totalConnections*100).toFixed(1)}%)\n`;
  report += `- **Средние связи** (0.4-0.7): ${totalConnections - strongConnections - weakConnections} (${((totalConnections - strongConnections - weakConnections)/totalConnections*100).toFixed(1)}%)\n`;
  report += `- **Слабые связи** (<0.4): ${weakConnections} (${(weakConnections/totalConnections*100).toFixed(1)}%)\n\n`;
  
  report += `### Структура кластеров\n\n`;
  const clusterNames = ['Синий', 'Красный', 'Зеленый', 'Фиолетовый', 'Оранжевый', 'Розовый', 'Коричневый', 'Серый', 'Желтый', 'Голубой'];
  
  for (let i = 0; i <= maxCluster; i++) {
    const stats = clusterStats[i];
    if (stats && stats.agentCount > 0) {
      const clusterName = clusterNames[i] || `Кластер ${i + 1}`;
      report += `**${clusterName} кластер (${i + 1}):**\n`;
      report += `- Агентов: ${stats.agentCount}\n`;
      report += `- Внутренних связей: ${stats.internalConnections}\n`;
      report += `- Внешних связей: ${stats.externalConnections}\n`;
      report += `- Среднее количество связей на агента: ${stats.avgDegree.toFixed(1)}\n`;
      report += `- Коэффициент замкнутости: ${(stats.internalConnections / (stats.internalConnections + stats.externalConnections) * 100).toFixed(1)}%\n\n`;
    }
  }
  
  report += `### Межкластерное взаимодействие\n\n`;
  report += `- **Связи внутри кластеров:** ${intraClusterConnections} (${(intraClusterConnections/totalConnections*100).toFixed(1)}%)\n`;
  report += `- **Связи между кластерами:** ${interClusterConnections} (${(interClusterConnections/totalConnections*100).toFixed(1)}%)\n\n`;
  
  if (interClusterConnections > intraClusterConnections) {
    report += `Сеть демонстрирует высокую степень интеграции между различными ценностными группами.\n\n`;
  } else {
    report += `Агенты преимущественно формируют связи внутри своих ценностных групп, что указывает на эффект гомофилии.\n\n`;
  }
  
  report += `### Ключевые агенты (топ-5 по количеству связей)\n\n`;
  topAgents.forEach((agent, index) => {
    const clusterNameLower = clusterNames[agent.cluster]?.toLowerCase() || `кластера ${agent.cluster + 1}`;
    report += `${index + 1}. **Агент ${agent.id}** (${clusterNameLower} кластер) — ${agent.degree} связей\n`;
  });
  report += `\n`;
  
  report += `### Интерпретация результатов\n\n`;
  
  if (scenario === 'A') {
    report += `В сценарии с нейтральной информационной повесткой наблюдается относительно равномерное распределение связей между кластерами. `;
    report += `Агенты формируют связи на основе общей совместимости ценностей, без влияния специфических тем.\n\n`;
  } else {
    report += `В сценарии с ценностно-близкой темой можно ожидать усиления связей внутри целевого кластера, `;
    report += `поскольку агенты с похожими ценностями чаще находят общие темы для обсуждения.\n\n`;
  }
  
  if (connectionDensity > 15) {
    report += `Высокая плотность сети (${connectionDensity}%) указывает на активное взаимодействие между агентами и формирование устойчивых социальных связей.\n\n`;
  } else if (connectionDensity > 8) {
    report += `Умеренная плотность сети (${connectionDensity}%) свидетельствует о селективном формировании связей на основе совместимости ценностей.\n\n`;
  } else {
    report += `Низкая плотность сети (${connectionDensity}%) может указывать на высокую избирательность агентов или значительные различия в ценностных ориентациях.\n\n`;
  }
  
  report += `### Практические выводы\n\n`;
  report += `Данная симуляция демонстрирует, как индивидуальные акты общения между агентами приводят к формированию сложных сетевых структур. `;
  report += `Каждое взаимодействие — это "бросок монетки": агенты могут найти общую тему и укрепить связь, или столкнуться с различиями во мнениях и отдалиться друг от друга. `;
  report += `Накопление тысяч таких микровзаимодействий создает наблюдаемую макроструктуру сети, которую человеческому мозгу сложно предсказать заранее.\n\n`;
  
  report += `Полученные результаты могут быть полезны для понимания процессов распространения информации, формирования общественного мнения и разработки стратегий коммуникации в социальных сетях.`;
  
  return report;
}

