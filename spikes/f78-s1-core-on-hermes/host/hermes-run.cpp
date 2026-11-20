// hermes-run: the smallest host that runs one JavaScript (or Hermes bytecode) file on the
// Hermes engine that React Native ships (hermesvm.framework, macOS slice of the hermes-ios
// artifact). It adds ONE global, `print(string)`, which writes the string and a newline to
// stdout. Nothing else: no console, no crypto, no timers. What the bundle finds is bare Hermes.
//
// The runtime is built as React Native builds it on the points that matter here: the microtask
// queue on (RN turns it on for queueMicrotask and Promise jobs) and Intl on (the default of this
// build). Usage: hermes-run <file.js | file.hbc>
#include <hermes/hermes.h>
#include <jsi/jsi.h>

#include <fstream>
#include <iostream>
#include <iterator>
#include <memory>
#include <string>

using namespace facebook;

namespace {
class FileBuffer : public jsi::Buffer {
 public:
  explicit FileBuffer(std::string data) : data_(std::move(data)) {}
  size_t size() const override { return data_.size(); }
  const uint8_t *data() const override {
    return reinterpret_cast<const uint8_t *>(data_.data());
  }

 private:
  std::string data_;
};
} // namespace

int main(int argc, char **argv) {
  if (argc != 2) {
    std::cerr << "usage: hermes-run <file.js|file.hbc>\n";
    return 2;
  }
  std::ifstream in(argv[1], std::ios::binary);
  if (!in) {
    std::cerr << "cannot read " << argv[1] << "\n";
    return 2;
  }
  std::string source((std::istreambuf_iterator<char>(in)), std::istreambuf_iterator<char>());

  auto config = ::hermes::vm::RuntimeConfig::Builder()
                    .withMicrotaskQueue(true)
                    .withIntl(true)
                    .build();
  auto runtime = facebook::hermes::makeHermesRuntime(config);
  jsi::Runtime &rt = *runtime;

  rt.global().setProperty(
      rt, "print",
      jsi::Function::createFromHostFunction(
          rt, jsi::PropNameID::forAscii(rt, "print"), 1,
          [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) {
            std::string out = count > 0 ? args[0].toString(rt).utf8(rt) : std::string();
            std::cout << out << "\n";
            return jsi::Value::undefined();
          }));

  try {
    auto buffer = std::make_shared<FileBuffer>(std::move(source));
    rt.evaluateJavaScript(buffer, argv[1]);
    while (!rt.drainMicrotasks()) {
    }
  } catch (const jsi::JSError &e) {
    std::cerr << "JSError: " << e.getMessage() << "\n" << e.getStack() << "\n";
    return 1;
  } catch (const jsi::JSIException &e) {
    std::cerr << "JSIException: " << e.what() << "\n";
    return 1;
  }
  std::cout.flush();
  return 0;
}
