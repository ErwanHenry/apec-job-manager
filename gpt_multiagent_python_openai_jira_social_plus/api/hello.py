def handler(request):
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
        },
        'body': '{"message": "🚀 Kaspa Community Tool API", "status": "working", "vercel": true}'
    }