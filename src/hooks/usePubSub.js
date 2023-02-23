import { debounce } from 'lodash'
import { useEffect } from 'react'
import PubSub from '/src/pubsub'

const usePubSub = (topic, callback, ids, useDebounce = true) => {
  const handlePubSub = (topicName, message) => {
    if (ids && !ids.includes(message?.summary?.entityId)) return
    console.log('WS Version Refetch', topicName)

    callback(topicName, message)
  }

  const handlePubSubDebounce = debounce(
    (topicName, message) => handlePubSub(topicName, message),
    100,
  )

  useEffect(() => {
    const token = PubSub.subscribe(topic, useDebounce ? handlePubSubDebounce : handlePubSub)
    return () => PubSub.unsubscribe(token)
  }, [ids])
}

export default usePubSub
