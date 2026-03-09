import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

// Provides the Secure Storage instance
final secureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage();
});

// Provides the API Base URL (Change to your actual backend IP/Domain when testing)
final apiBaseUrlProvider = Provider<String>((ref) {
  return 'http://10.0.2.2:8080/api'; // Android Emulator alias for localhost
});

// Provides the configured Dio client
final dioClientProvider = Provider<Dio>((ref) {
  final secureStorage = ref.watch(secureStorageProvider);
  final baseUrl = ref.watch(apiBaseUrlProvider);

  final dio = Dio(BaseOptions(
    baseUrl: baseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  ));

  // Add interceptor for attaching JWT token to requests
  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Retrieve token from secure storage
        final token = await secureStorage.read(key: 'auth_token');
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) {
        // Global error handling can be done here (e.g., logging out on 401)
        if (e.response?.statusCode == 401) {
          // Handle unauthorized access
          // e.g., clear secure storage and redirect to login via router
        }
        return handler.next(e);
      },
    ),
  );

  return dio;
});
